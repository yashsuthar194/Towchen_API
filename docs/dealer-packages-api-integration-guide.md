# Towchen Dealer Portal & Packages API Integration Guide

This guide is for frontend and web developers building the **Dealer Portal Website** and **Admin Panel**. It details how to bind all endpoints, construct multipart payloads, capture browser geo-location & timestamp inspection metadata, resolve dynamic segment pricing, and trigger certificate PDF downloads.

---

## Table of Contents
1. [Architecture & Authentication](#1-architecture--authentication)
2. [Enums & Fixed Dropdown Values](#2-enums--fixed-dropdown-values)
3. [Dealer Workflow (Frontend Steps)](#3-dealer-workflow-frontend-steps)
   - [Step 1: Dealer Login & Session](#step-1-dealer-login--session)
   - [Step 2: Car Segment Selection & Dynamic Pricing](#step-2-car-segment-selection--dynamic-pricing)
   - [Step 3: In-Browser Camera & Geo-Location Plugin](#step-3-in-browser-camera--geo-location-plugin)
   - [Step 4: Submitting Customer & Vehicle Package (Multipart)](#step-4-submitting-customer--vehicle-package-multipart)
   - [Step 5: Package Certificate Download](#step-5-package-certificate-download)
   - [Step 6: Dealer Packages List & Search](#step-6-dealer-packages-list--search)
4. [Admin Portal APIs (Package Plans & Manual Usage)](#4-admin-portal-apis)
5. [Frontend Code Implementation Example (Vanilla / React)](#5-frontend-code-implementation-example)

---

## 1. Architecture & Authentication

All dealer endpoints require a **Bearer JWT Token** in the HTTP request headers:
```http
Authorization: Bearer <access_token>
```

### Dealer Auth Endpoints (`/dealer-auth`)

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/dealer-auth/login` | Dealer login | `{ "email": "...", "password": "..." }` | `{ access_token, refresh_token, dealer }` |
| `POST` | `/dealer-auth/register` | Dealer self-registration | Complete registration DTO (profile + bank info) | `{ access_token, refresh_token, dealer }` |
| `POST` | `/dealer-auth/refresh` | Refresh JWT token | `{ "refresh_token": "..." }` | `{ access_token, refresh_token, dealer }` |
| `GET` | `/dealer-auth/me` | Current authenticated dealer profile | Header: `Bearer <token>` | `DealerProfileDto` |

> **Note**: When a dealer creates a package, the backend automatically reads the authenticated dealer's session (`req.user.id`). You **do not** need to pass `dealer_id` manually in the body.

---

## 2. Enums & Fixed Dropdown Values

Use these exact string values for dropdowns and query parameters:

### `CarSegment` (3 Fixed Tiers)
- `Basic`: Hatchbacks, compacts, entry sedans (e.g., Maruti Swift, Dzire, Hyundai i10/i20).
- `Standard`: Mid-size sedans, compact/mid SUVs (e.g., Hyundai Creta, Honda City, Kia Seltos).
- `Premium`: Luxury sedans and large/luxury SUVs (e.g., Mercedes, BMW, Audi, Fortuner).

### `FuelType`
- `Petrol`, `Diesel`, `CNG`, `Electric`, `Hybrid`, `LPG`

### `TransmissionType`
- `Manual`, `Automatic`

### `DealerPackageStatus`
- `Active`, `Expired`, `Cancelled`

### `PackagePaymentStatus`
- `PendingInternalSettlement`, `Completed`, `Waived`

---

## 3. Dealer Workflow (Frontend Steps)

### Step 1: Dealer Login & Session
Log the dealer in via `POST /dealer-auth/login` and store `access_token` in memory or secure storage.

---

### Step 2: Car Segment Selection & Dynamic Pricing
When the dealer selects the vehicle's segment (`Basic`, `Standard`, or `Premium`), fetch the active package plans and their applicable price for that segment:

```http
GET /dealer-package-plan?segment=Basic
Authorization: Bearer <access_token>
```

#### Query Parameters:
- `segment` *(optional)*: `Basic` | `Standard` | `Premium`.

#### Response Example:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active dealer package plans retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Gold Mobility Shield",
      "plan_period_months": 12,
      "incidents": 4,
      "distance_km": 50.0,
      "hotel_accommodation": 2,
      "cab_service": 2,
      "price_basic": 1999.0,
      "price_standard": 2999.0,
      "price_premium": 4999.0,
      "selected_segment": "Basic",
      "resolved_price": 1999.0
    }
  ]
}
```
> **UI Display**: Show `data[i].resolved_price` as the plan cost to the dealer based on their chosen segment.

---

### Step 3: In-Browser Camera & Geo-Location Plugin
The web page must capture **5 inspection images** (4 vehicle sides + 1 odometer reading). Whenever an image is clicked/captured, the browser should extract the current latitude, longitude, and ISO timestamp.

#### Browser Geo-Location Snippet:
```javascript
async function getInspectionLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          captured_at: new Date().toISOString(),
        });
      },
      () => {
        // Fallback if user denied location permission
        resolve({
          latitude: null,
          longitude: null,
          captured_at: new Date().toISOString(),
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

Format the meta objects as JSON strings when attaching to `FormData`:
- `vehicle_images_meta`: `JSON.stringify({ latitude, longitude, captured_at })`
- `odometer_image_meta`: `JSON.stringify({ latitude, longitude, captured_at })`

---

### Step 4: Submitting Customer & Vehicle Package (Multipart)

```http
POST /dealer-package-order
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### Payload Fields (Send as `FormData`):

| Key | Type | Required | Description / Example |
| :--- | :--- | :---: | :--- |
| `customer_name` | String | Yes | `Rahul Sharma` |
| `customer_number` | String | Yes | `+919876543210` |
| `alternative_number` | String | No | `+919876543211` |
| `email_address` | String | Yes | `rahul.sharma@example.com` |
| `building` | String | No | `Flat 402, Sunshine Heights` |
| `block` | String | No | `Wing B` |
| `road` | String | No | `MG Road` |
| `city` | String | Yes | `Mumbai` |
| `state` | String | Yes | `Maharashtra` |
| `pincode` | String | Yes | `400001` |
| `gst_number` | String | No | `27AAAAA0000A1Z5` |
| `vehicle_reg_number` | String | Yes | `MH02AB1234` |
| `vehicle_make` | String | Yes | `Maruti Suzuki` |
| `vehicle_model` | String | Yes | `Dzire` |
| `vehicle_fuel_type` | String | Yes | `Petrol` |
| `transmission_type` | String | Yes | `Manual` |
| `registration_year` | Number | Yes | `2022` |
| `chassis_number` | String | Yes | `MA3EAA12S00123456` |
| `current_odometer_reading` | Number | Yes | `34500` |
| `car_segment` | String | Yes | `Basic` \| `Standard` \| `Premium` |
| `package_plan_id` | Number | Yes | `1` |
| `package_plan_start_date` | String | Yes | `2026-10-04` (YYYY-MM-DD or ISO) |
| `vehicle_images_meta` | String (JSON) | No | `{"latitude": 19.076, "longitude": 72.877, "captured_at": "..."}` |
| `odometer_image_meta` | String (JSON) | No | `{"latitude": 19.076, "longitude": 72.877, "captured_at": "..."}` |
| `image_front` | File | Yes | Front side vehicle photo (PNG / JPEG) |
| `image_rear` | File | Yes | Rear side vehicle photo (PNG / JPEG) |
| `image_left` | File | Yes | Left side vehicle photo (PNG / JPEG) |
| `image_right` | File | Yes | Right side vehicle photo (PNG / JPEG) |
| `odometer_image` | File | Yes | Dashboard odometer photo (PNG / JPEG) |

#### Response (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Dealer package order created and certificate generated successfully",
  "data": {
    "id": 1,
    "order_number": "DPKG0000001",
    "dealer_id": 2,
    "plan_name": "Gold Mobility Shield",
    "car_segment": "Basic",
    "amount": 1999.0,
    "plan_period_months": 12,
    "incidents_allowed": 4,
    "incidents_used": 0,
    "distance_km_allowed": 50.0,
    "hotel_accommodation_allowed": 2,
    "hotel_accommodation_used": 0,
    "cab_service_allowed": 2,
    "cab_service_used": 0,
    "start_date": "2026-10-04T00:00:00.000Z",
    "expiry_date": "2027-10-04T00:00:00.000Z",
    "status": "Active",
    "payment_status": "PendingInternalSettlement",
    "package_pdf_url": "https://pub-88bff11829e24671b851121c59781ac4.r2.dev/dealer/package_certificates/DPKG0000001.pdf",
    "created_at": "2026-10-04T15:30:00.000Z",
    "customer": {
      "id": 1,
      "customer_name": "Rahul Sharma",
      "customer_number": "+919876543210",
      "email_address": "rahul.sharma@example.com"
    },
    "vehicle": {
      "id": 1,
      "vehicle_reg_number": "MH02AB1234",
      "vehicle_make": "Maruti Suzuki",
      "vehicle_model": "Dzire",
      "car_segment": "Basic"
    }
  }
}
```

---

### Step 5: Package Certificate Download
Immediately after order creation or anytime from the dealer dashboard:

```http
GET /dealer-package-order/:id/download
Authorization: Bearer <access_token>
```

#### Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Certificate download URL retrieved successfully",
  "data": {
    "order_number": "DPKG0000001",
    "download_url": "https://pub-88bff11829e24671b851121c59781ac4.r2.dev/dealer/package_certificates/DPKG0000001.pdf"
  }
}
```
Open `data.download_url` in a new window or trigger an automatic `<a href={download_url} download>` download.

---

### Step 6: Dealer Packages List & Search

```http
GET /dealer-package-order?page=1&limit=10&search=MH02
Authorization: Bearer <access_token>
```

#### Query Parameters:
- `page` *(optional, default 1)*
- `limit` *(optional, default 10)*
- `search` *(optional)*: Matches order number (`DPKG...`), customer name, customer phone, or vehicle registration number.
- `status` *(optional)*: `Active` | `Expired` | `Cancelled`
- `payment_status` *(optional)*: `PendingInternalSettlement` | `Completed` | `Waived`

#### Single Package Order Details:
```http
GET /dealer-package-order/:id
Authorization: Bearer <access_token>
```
Returns full order snapshot with inspection photo URLs, customer address, vehicle specs, and quota counters.

---

## 4. Admin Portal APIs

Admins use these endpoints with an Admin JWT (`AdminGuard`).

### 4.1 Create / Manage Package Plans (`/dealer-package-plan`)

```http
POST /dealer-package-plan
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body:
```json
{
  "name": "Platinum Mobility Shield",
  "plan_period_months": 12,
  "incidents": 6,
  "distance_km": 100.0,
  "hotel_accommodation": 3,
  "cab_service": 3,
  "price_basic": 2999.0,
  "price_standard": 4499.0,
  "price_premium": 6999.0,
  "is_active": true
}
```

- `GET /dealer-package-plan/all`: View all package plans (active and inactive).
- `PUT /dealer-package-plan/:id`: Update pricing or coverage quotas.
- `DELETE /dealer-package-plan/:id`: Deactivate package plan.

---

### 4.2 Admin View All Dealer Packages

```http
GET /dealer-package-order/admin/all?page=1&limit=20&search=Rahul
Authorization: Bearer <admin_token>
```

---

### 4.3 Manual Usage Tracking by Admin

When a customer uses a breakdown incident, hotel accommodation stay, or cab service ride, the admin manually updates the record:

```http
PATCH /dealer-package-order/admin/:id/usage
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body:
```json
{
  "incidents_used": 1,
  "hotel_accommodation_used": 1,
  "cab_service_used": 1,
  "admin_notes": "Hotel stay approved at Hotel Grand Central, Pune on 04-Oct breakdown incident.",
  "payment_status": "Completed"
}
```

#### Response:
Returns updated order with new usage counters and operational admin notes.

---

## 5. Frontend Code Implementation Example

### Complete JavaScript Submission Function

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://your-api-domain.com';

export async function submitDealerPackageOrder({
  token,
  customerData,
  vehicleData,
  packageData,
  files, // { front, rear, left, right, odometer }
  geoData, // { latitude, longitude, captured_at }
}) {
  const formData = new FormData();

  // 1. Customer Details
  formData.append('customer_name', customerData.name);
  formData.append('customer_number', customerData.number);
  if (customerData.altNumber) formData.append('alternative_number', customerData.altNumber);
  formData.append('email_address', customerData.email);
  if (customerData.building) formData.append('building', customerData.building);
  if (customerData.block) formData.append('block', customerData.block);
  if (customerData.road) formData.append('road', customerData.road);
  formData.append('city', customerData.city);
  formData.append('state', customerData.state);
  formData.append('pincode', customerData.pincode);
  if (customerData.gstNumber) formData.append('gst_number', customerData.gstNumber);

  // 2. Vehicle Details
  formData.append('vehicle_reg_number', vehicleData.regNumber);
  formData.append('vehicle_make', vehicleData.make);
  formData.append('vehicle_model', vehicleData.model);
  formData.append('vehicle_fuel_type', vehicleData.fuelType);
  formData.append('transmission_type', vehicleData.transmissionType);
  formData.append('registration_year', String(vehicleData.registrationYear));
  formData.append('chassis_number', vehicleData.chassisNumber);
  formData.append('current_odometer_reading', String(vehicleData.odometerReading));
  formData.append('car_segment', vehicleData.carSegment); // 'Basic' | 'Standard' | 'Premium'

  // 3. Package Plan
  formData.append('package_plan_id', String(packageData.planId));
  formData.append('package_plan_start_date', packageData.startDate); // '2026-10-04'

  // 4. Geo-Temporal Metadata
  if (geoData) {
    const metaString = JSON.stringify(geoData);
    formData.append('vehicle_images_meta', metaString);
    formData.append('odometer_image_meta', metaString);
  }

  // 5. 5 Inspection Image Files
  formData.append('image_front', files.front);
  formData.append('image_rear', files.rear);
  formData.append('image_left', files.left);
  formData.append('image_right', files.right);
  formData.append('odometer_image', files.odometer);

  // 6. Execute Request
  const response = await axios.post(`${API_BASE_URL}/dealer-package-order`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
```

---

## 6. Swagger API Documentation

For interactive testing and schema inspection, open the Swagger UI:
- **URL**: `http://localhost:3000/api` (or your deployed API domain `/api`)
- **Tags to inspect**:
  - `Dealer Package Orders`
  - `Dealer Package Plan`
  - `Dealer Auth`
