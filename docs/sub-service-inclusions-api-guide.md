# Sub-Service Inclusions (Conditions) API Integration Guide

This guide details **Option 1: Managing Standard Inclusions via the REST API** in `Towchen_API`.

---

## 1. Overview

Each roadside recovery and towing service card in `Towchen_Web` displays a list of **Standard Inclusions**. These are dynamically fetched from the database table `sub_service_condtion` via the backend REST API.

```
+--------------------------------------------------------+
| Flatbed Towing                            Towing Fleet |
| Professional Flatbed roadside assistance dispatched... |
|                                                        |
| STANDARD INCLUSIONS:                                   |
| [✓] Zero ground-contact hydraulic tilt deck            |
| [✓] First 5 km transport included (+₹20/km extra)      |
| [✓] Live GPS tracking with real-time arrival ETA       |
+--------------------------------------------------------+
```

---

## 2. Base URL & Authentication

* **Local Base URL:** `http://localhost:3001`
* **Production Base URL:** `https://towchen-api-1.onrender.com`
* **Auth Requirement:** The `/sub-service-condition` endpoints are public / admin operational routes.
* **Content-Type:** `application/json`

---

## 3. Sub-Service ID Reference Table

Use the corresponding `sub_service_id` when adding, listing, or updating conditions:

| `sub_service_id` | Sub-Service Name | Parent Category | Database `service_id` |
| :---: | :--- | :--- | :---: |
| **1** | Flatbed | Towing | 1 |
| **3** | Underlift | Towing | 1 |
| **4** | Zero Degree | Towing | 1 |
| **5** | 2-Wheeler Flatbed | Towing | 1 |
| **11** | Flatbed Towing | Towing | 1 |
| **2** | Jump Start | Technician | 2 |
| **6** | Mechanic | Technician | 2 |
| **7** | Custodian | Custody | 3 |
| **8** | 12 Ton | Hydra | 4 |
| **10** | 25+ Ton | Hydra | 4 |

---

## 4. API Endpoints

### 4.1 Create a Standard Inclusion (Condition)

Adds a new standard inclusion to a specific sub-service.

* **Endpoint:** `POST /sub-service-condition`
* **Headers:**
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

#### Request Body
```json
{
  "sub_service_id": 1,
  "condition": "Zero ground-contact hydraulic tilt deck"
}
```

| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `sub_service_id` | number | **Yes** | The numeric ID of the sub-service (e.g. `1` for Flatbed). |
| `condition` | string | **Yes** | The inclusion title or description to be displayed on the card. |

#### Response (`201 Created`)
```json
{
  "status": 201,
  "message": "Condition created successfully",
  "data": {
    "id": 15,
    "sub_service_id": 1,
    "condition": "Zero ground-contact hydraulic tilt deck",
    "created_at": "2026-11-24T02:25:00.000Z",
    "updated_at": "2026-11-24T02:25:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X POST http://localhost:3001/sub-service-condition \
  -H "Content-Type: application/json" \
  -d '{
    "sub_service_id": 1,
    "condition": "Zero ground-contact hydraulic tilt deck"
  }'
```

---

### 4.2 Get All Inclusions for a Sub-Service

Retrieves all current inclusions for a given `sub_service_id`.

* **Endpoint:** `GET /sub-service-condition/sub-service/:subServiceId`
* **Example:** `GET /sub-service-condition/sub-service/1`

#### Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Conditions retrieved successfully",
  "data": [
    {
      "id": 1,
      "sub_service_id": 1,
      "condition": "Soft nylon wheel webbings & safety rigging",
      "created_at": "2026-08-02T15:30:58.547Z",
      "updated_at": "2026-08-02T15:30:58.547Z"
    },
    {
      "id": 2,
      "sub_service_id": 1,
      "condition": "Ideal for AWD, 4x4, & low-clearance luxury cars",
      "created_at": "2026-08-02T15:31:23.700Z",
      "updated_at": "2026-08-02T15:31:23.700Z"
    }
  ]
}
```

#### cURL Example
```bash
curl -X GET http://localhost:3001/sub-service-condition/sub-service/1
```

---

### 4.3 Update an Existing Inclusion

Updates the text of an inclusion by its condition ID.

* **Endpoint:** `PUT /sub-service-condition/:id`
* **Example:** `PUT /sub-service-condition/1`

#### Request Body
```json
{
  "condition": "Zero-scratch soft nylon tire webbings included"
}
```

#### Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Condition updated successfully",
  "data": {
    "id": 1,
    "sub_service_id": 1,
    "condition": "Zero-scratch soft nylon tire webbings included",
    "created_at": "2026-08-02T15:30:58.547Z",
    "updated_at": "2026-11-24T02:26:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X PUT http://localhost:3001/sub-service-condition/1 \
  -H "Content-Type: application/json" \
  -d '{
    "condition": "Zero-scratch soft nylon tire webbings included"
  }'
```

---

### 4.4 Delete an Inclusion

Removes an inclusion from the sub-service.

* **Endpoint:** `DELETE /sub-service-condition/:id`
* **Example:** `DELETE /sub-service-condition/2`

#### Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Condition deleted successfully",
  "data": null
}
```

#### cURL Example
```bash
curl -X DELETE http://localhost:3001/sub-service-condition/2
```

---

## 5. Verifying on the Services Catalog

Once you create or update an inclusion using the API, you can verify it in two ways:

1. **Verify Backend JSON Output:**
   Call the aggregated services endpoint:
   ```bash
   curl -X GET "http://localhost:3001/service?include_sub_services=true"
   ```
   Each sub-service will include its `conditions` array:
   ```json
   {
     "id": 1,
     "name": "Flatbed",
     "service_id": 1,
     "conditions": [
       { "id": 1, "condition": "Zero ground-contact hydraulic tilt deck" }
     ]
   }
   ```

2. **Verify Frontend UI:**
   Refresh `http://localhost:3000/services`. The new inclusion will immediately show under the **STANDARD INCLUSIONS** section of that sub-service card.
