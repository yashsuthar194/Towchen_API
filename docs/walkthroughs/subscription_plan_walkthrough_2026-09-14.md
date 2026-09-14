# Comprehensive Walkthrough: Subscription Plan Implementation

I have completed the end-to-end implementation for Subscription Plans, which includes database schema modifications, database migrations, and a fully secured REST API.

Here is a summary of all the components built:

## 1. Database Schema (`schema.prisma`)
Added the new `subscription_plan` model to map the required fields.
- **Fields Added**:
  - `name`: Name of the plan.
  - `pricing`: Cost of the plan (`Float`).
  - `plan_period_months`: Duration in months.
  - `incidents`: Total incidents allowed/covered.
  - `distance_km`: Maximum towing distance allowed.
  - `vehicle_type`: Uses your existing `VehicleType` enum.
  - `is_active`: Boolean to toggle the plan's availability (defaults to `true`).

## 2. Database Synchronization & Migration
To bypass the shadow-database connection issue on Aiven:
- Executed `npx prisma db push` to synchronize the new model directly into your Aiven database.
- Manually generated the raw SQL migration script `20260914201000_add_subscription_plan/migration.sql` by extracting a git diff. This ensures your project's Prisma migration history remains complete for future deployments.

## 3. NestJS API Module (`SubscriptionPlanModule`)
A completely new, standalone module was created under `src/modules/subscription-plan/` and registered into the main `AppModule`.

### **DTOs (Data Transfer Objects)**
Validation rules were established using `class-validator` to ensure all fields are properly formatted before hitting the database:
- [`create-subscription-plan.dto.ts`](file:///c:/vinit/mydrive/Study/Towchein/Towchen_API/src/modules/subscription-plan/dto/create-subscription-plan.dto.ts): Ensures pricing isn't negative, months are > 0, and the vehicle type matches the enum.
- [`update-subscription-plan.dto.ts`](file:///c:/vinit/mydrive/Study/Towchein/Towchen_API/src/modules/subscription-plan/dto/update-subscription-plan.dto.ts): Same rules as Create, but makes all fields optional for partial updates.
- [`subscription-plan.dto.ts`](file:///c:/vinit/mydrive/Study/Towchein/Towchen_API/src/modules/subscription-plan/dto/subscription-plan.dto.ts): Formats the response payload.

### **Controller & Service**
The new endpoints handle CRUD operations using `PrismaService` and return standard structured responses using your custom `ResponseDto` utility.

| Method | Endpoint | Guard | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/subscription-plan` | None | Public route to fetch all active plans. |
| **GET** | `/subscription-plan/all` | `AdminGuard` | Protected route fetching all plans (including inactive). |
| **GET** | `/subscription-plan/:id` | None | Public route to fetch a single plan. |
| **POST** | `/subscription-plan` | `AdminGuard` | Protected route to create a new plan. |
| **PUT** | `/subscription-plan/:id`| `AdminGuard` | Protected route to update a plan's fields (e.g. pricing, status). |
| **DELETE**| `/subscription-plan/:id`| `AdminGuard` | Protected route to delete a plan entirely. |

> [!TIP]
> **Admin Authentication**
> The `POST`, `PUT`, `DELETE`, and `GET /all` routes are locked behind both `JwtAuthGuard` and `AdminGuard`. An admin JWT token must be passed in the `Authorization` header to execute these requests.

## Verification
- Code successfully compiled with zero TypeScript errors (`npx tsc`).
- The database structure has been updated and the migration file saved.
- Your development server picked up the new routes, which are immediately accessible via your Swagger UI.

---

## 5. Customer-Side Subscription Buying Logic (Hybrid System)

I have fully implemented the customer side logic allowing users to purchase subscriptions for multiple vehicles at once, complete with a Hybrid Cron-based activation system.

### Database Adjustments
- **Snapshotted Plans**: A new `customer_vehicle_subscription` table was created. At the time of purchase, we snapshot the plan data (e.g. `plan_pricing`, `plan_period_months`) directly into the user's subscription record. This guarantees historical consistency even if the master plan is updated later.
- **Incident Usage Tracking**: Replaced simple counters with a `subscription_incident_usage` table to accurately track exactly which `order_id` consumed a subscription incident.
- **is_active Flag**: Subscriptions now carry an `is_active` flag, allowing future flexibility for overlapping subscriptions or customer support overrides.

### API Additions

A new `CustomerSubscriptionModule` provides the following endpoints:

| Method | Endpoint | Guard | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/customer-subscription/vehicles-and-plans` | `CustomerGuard` | Returns all of the customer's vehicles, evaluating their current active/pending subscriptions, and lists available plans that match the `vehicle_type`. |
| **POST** | `/customer-subscription/purchase` | `CustomerGuard` | Submits the purchase cart. Requires `rc_book_url`. Runs a highly secure Prisma `$transaction` to insert the purchase and all vehicle subscriptions at once. Double-subscription attempts are automatically rejected. |
| **GET** | `/admin/subscription/pending-manual-activation` | `AdminGuard` | An admin dashboard API that lists all subscriptions that have missed their automatic cron activation (i.e., `status` is `PendingActivation` but `starts_at` is in the past). |

> [!TIP]
> **The Hybrid Activation System**
> Customer subscriptions begin X days after purchase. Their initial status is `PendingActivation`. 
> I built a Cron Job (`handleSubscriptionActivationCron`) that runs **every hour** to automatically transition due subscriptions to `Active`. 
> Additionally, the `GET /admin/subscription/pending-manual-activation` endpoint serves as a backup, allowing you to manually process any edge cases.
