# Towchen API — Order Flow Documentation

## Overview

The Order module manages the full lifecycle of a towing/service request — from a customer creating an order, to a driver accepting it, to OTP-verified start and completion.

---

## Order Statuses

| Status       | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `New`        | Order has been created and is waiting for a driver to accept             |
| `Assigned`   | (Reserved) A driver has been assigned but flow currently skips to OTP    |
| `OtpPending` | Driver accepted; waiting for START OTP verification from the customer    |
| `InProgress` | START OTP verified; the driver is actively performing the service        |
| `Completed`  | COMPLETE OTP verified; the service has been finished                     |
| `Closed`     | (Reserved) For post-completion administrative closure                    |

---

## Flow Diagram

```
  Customer                          System                          Driver
  ────────                          ──────                          ──────
     │                                 │                               │
     │  1. POST /order                 │                               │
     │  (Create Order)                 │                               │
     │────────────────────────────────>│                               │
     │                                 │  Status: New                  │
     │                                 │                               │
     │                                 │    2. PATCH /order/:id/accept │
     │                                 │<──────────────────────────────│
     │                                 │  - Assign driver/vehicle      │
     │                                 │  - Auto-generate START OTP    │
     │                                 │  Status: OtpPending           │
     │                                 │                               │
     │   (Customer receives OTP)       │                               │
     │<────────────────────────────────│                               │
     │                                 │                               │
     │   (Customer tells OTP           │  3. POST /order/:id/verify-otp│
     │    to driver in person)         │  { type: "START", otp: "..." }│
     │                                 │<──────────────────────────────│
     │                                 │  Status: InProgress           │
     │                                 │  start_time recorded          │
     │                                 │                               │
     │                                 │  ─── Service Being Done ───   │
     │                                 │                               │
     │                                 │  4. POST /order/:id/send-otp  │
     │                                 │  { type: "COMPLETE" }         │
     │                                 │<──────────────────────────────│
     │                                 │  Status: OtpPending           │
     │                                 │  COMPLETE OTP generated       │
     │                                 │                               │
     │   (Customer receives OTP)       │                               │
     │<────────────────────────────────│                               │
     │                                 │                               │
     │   (Customer tells OTP           │  5. POST /order/:id/verify-otp│
     │    to driver in person)         │  { type: "COMPLETE", otp: "…"}│
     │                                 │<──────────────────────────────│
     │                                 │  Status: Completed            │
     │                                 │  completion_time recorded     │
     │                                 │                               │
```

---

## API Endpoints (Detailed)

### Step 1 — Create Order

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Endpoint**       | `POST /order`                                                          |
| **Auth**           | JWT (any authenticated user)                                           |
| **Swagger Tag**    | `Order`                                                                |
| **Request Body**   | `CreateOrderDto`                                                       |
| **Response**       | `OrderDetailDto` with linked breakdown & drop locations                |

**What happens internally:**
1. Creates a `Breakdown` location and a `Drop` location in the `location` table.
2. Creates the `order` record with status `New`.
3. Links both locations to the order via `order_location`.
4. Everything runs inside a `$transaction` — if any step fails, all changes roll back.

---

### Step 2 — Accept Order (Driver)

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Endpoint**       | `PATCH /order/:id/accept`                                              |
| **Auth**           | JWT (Driver role only)                                                 |
| **Swagger Tag**    | `Order - Driver Actions`                                               |
| **Response**       | `OrderDetailDto` with driver, vehicle, vendor & locations              |

**What happens internally:**
1. Validates the caller is a Driver.
2. Checks the order exists and is in `New` status.
3. Assigns `driver_id`, `vehicle_id`, `vendor_id` from the driver's profile.
4. Generates a 6-digit `START` OTP (expires in 10 minutes).
5. Saves the OTP in `order_otp` table.
6. Links the driver's start/end locations to the order.
7. Updates order status to `OtpPending`.
8. Records `assign_time`.

---

### Step 3 — Send OTP (Driver)

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Endpoint**       | `POST /order/:id/send-otp`                                            |
| **Auth**           | JWT (Driver role only)                                                 |
| **Swagger Tag**    | `Order - Driver Actions`                                               |
| **Request Body**   | `SendOrderOtpDto` — `{ type: "START" | "COMPLETE" }`                  |
| **Response**       | `{ message: "OTP sent successfully to <number>" }`                     |

**What happens internally:**
1. Validates the caller is the assigned driver for this order.
2. Generates a new 6-digit OTP with 10-minute expiry.
3. Upserts the OTP record (creates or replaces existing for the same type).
4. Updates order status to `OtpPending`.
5. Sends the OTP to the customer's phone number (SMS integration placeholder).

---

### Step 4 — Verify OTP (Driver)

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Endpoint**       | `POST /order/:id/verify-otp`                                          |
| **Auth**           | JWT (Driver role only)                                                 |
| **Swagger Tag**    | `Order - Driver Actions`                                               |
| **Request Body**   | `VerifyOrderOtpDto` — `{ type: "START" | "COMPLETE", otp: "123456" }` |
| **Response**       | `{ message: "OTP verified successfully. Order is now ..." }`           |

**What happens internally:**
1. Validates the caller is the assigned driver.
2. Fetches the OTP record for the given order + type.
3. Checks: not already verified, not expired, and the code matches.
4. On mismatch: increments the `attempts` counter and throws an error.
5. On match:
   - Marks the OTP as `is_verified = true`, records `verified_at`.
   - If type is `START` → status becomes `InProgress`, records `start_time`.
   - If type is `COMPLETE` → status becomes `Completed`, records `completion_time`.

---

## Data Model Relationships

```
order
  ├── customer          (belongs to)
  ├── customer_vehicle   (optional, belongs to)
  ├── vendor             (optional, assigned on accept)
  ├── driver             (optional, assigned on accept)
  ├── vehicle            (optional, assigned on accept)
  ├── locations[]        (order_location join table)
  │     ├── Breakdown    (created with order)
  │     ├── Drop         (created with order)
  │     ├── Start        (driver's start, linked on accept)
  │     └── End          (driver's end, linked on accept)
  └── otps[]             (order_otp table)
        ├── START        (created on accept / send-otp)
        └── COMPLETE     (created on send-otp)
```

---

## OTP Security Rules

- **Expiry**: 10 minutes from generation.
- **Length**: 6 digits (100000–999999).
- **Attempts tracking**: Each wrong attempt increments `attempts` counter.
- **One-time use**: Once verified, the OTP cannot be re-used.
- **Upsert behavior**: Requesting a new OTP for the same order+type replaces the old one.

---

## Timeline Fields on the Order

| Field             | Set When                    |
| ----------------- | --------------------------- |
| `created_at`      | Order creation              |
| `assign_time`     | Driver accepts the order    |
| `start_time`      | START OTP verified          |
| `completion_time` | COMPLETE OTP verified       |
