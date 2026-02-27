# Pharmacy CRM - REST API Documentation

## Overview

The Pharmacy CRM REST API provides complete inventory management, sales tracking, and pharmaceutical product management capabilities. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-deployment-url/api`

## Authentication

Currently, the API does not require authentication (suitable for internal use). For production deployment, consider adding:
- API Keys
- JWT tokens
- OAuth 2.0

## Response Format

All API responses follow a consistent format:

### Success Response (200, 201)
```json
{
  "data": { ... },
  "status": "success",
  "message": "Operation completed successfully"
}
```

### Error Response (4xx, 5xx)
```json
{
  "detail": "Error description",
  "status_code": 400
}
```

## Endpoints

### 1. Dashboard Endpoints

#### Get Dashboard Statistics
**Endpoint**: `GET /dashboard/stats`

**Description**: Retrieves today's sales summary, items sold, low stock count, and purchase orders value.

**Query Parameters**: None

**Response** (200):
```json
{
  "todays_sales": 304.75,
  "items_sold_today": 15,
  "low_stock_items": 1,
  "purchase_orders": 2050.0
}
```

**Error Cases**:
- 500 Internal Server Error: Database connection issue

---

#### Get Recent Sales
**Endpoint**: `GET /dashboard/recent-sales`

**Description**: Retrieves the last N sales transactions (default: 5).

**Query Parameters**:
- `limit` (optional, default: 5): Number of recent sales to retrieve

**Response** (200):
```json
[
  {
    "id": 1,
    "invoice_no": "INV001",
    "customer_name": "John Doe",
    "items_count": 3,
    "total_amount": 45.50,
    "payment_method": "Cash",
    "date": "2026-02-27T10:30:00",
    "status": "Completed"
  },
  ...
]
```

**Error Cases**:
- 500 Internal Server Error: Database query issue

---

### 2. Inventory Endpoints

#### List Medicines
**Endpoint**: `GET /inventory/medicines`

**Description**: Retrieves all medicines with optional search and pagination.

**Query Parameters**:
- `skip` (optional, default: 0): Number of records to skip for pagination
- `limit` (optional, default: 100): Number of records to return
- `search` (optional): Search by medicine name or generic name

**Response** (200):
```json
[
  {
    "id": 1,
    "medicine_name": "Aspirin",
    "generic_name": "Acetylsalicylic Acid",
    "category": "Pain Relief",
    "batch_no": "BATCH001",
    "expiry_date": "2027-02-27",
    "quantity": 150,
    "cost_price": 2.50,
    "mrp": 5.00,
    "supplier": "PharmaCo",
    "status": "Active"
  },
  ...
]
```

**Example**: `GET /inventory/medicines?search=aspirin&limit=10&skip=0`

**Error Cases**:
- 500 Internal Server Error: Database query issue

---

#### Get Single Medicine
**Endpoint**: `GET /inventory/medicines/{medicine_id}`

**Description**: Retrieves a specific medicine by ID.

**Path Parameters**:
- `medicine_id` (required, integer): The medicine ID

**Response** (200):
```json
{
  "id": 1,
  "medicine_name": "Aspirin",
  "generic_name": "Acetylsalicylic Acid",
  "category": "Pain Relief",
  "batch_no": "BATCH001",
  "expiry_date": "2027-02-27",
  "quantity": 150,
  "cost_price": 2.50,
  "mrp": 5.00,
  "supplier": "PharmaCo",
  "status": "Active"
}
```

**Error Cases**:
- 404 Not Found: Medicine with given ID does not exist
- 500 Internal Server Error: Database query issue

---

#### Add Medicine
**Endpoint**: `POST /inventory/medicines`

**Description**: Creates a new medicine in the inventory. Status is automatically determined.

**Request Body**:
```json
{
  "medicine_name": "Aspirin",
  "generic_name": "Acetylsalicylic Acid",
  "category": "Pain Relief",
  "batch_no": "BATCH001",
  "expiry_date": "2027-02-27",
  "quantity": 150,
  "cost_price": 2.50,
  "mrp": 5.00,
  "supplier": "PharmaCo"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "medicine_name": "Aspirin",
  "generic_name": "Acetylsalicylic Acid",
  "category": "Pain Relief",
  "batch_no": "BATCH001",
  "expiry_date": "2027-02-27",
  "quantity": 150,
  "cost_price": 2.50,
  "mrp": 5.00,
  "supplier": "PharmaCo",
  "status": "Active",
  "created_at": "2026-02-27T10:30:00",
  "updated_at": "2026-02-27T10:30:00"
}
```

**Validation Rules**:
- `medicine_name`: Required, non-empty string
- `generic_name`: Required, non-empty string
- `supplier`: Required, non-empty string
- `cost_price`: Required, must be > 0
- `mrp`: Required, must be > 0 and >= cost_price
- `quantity`: Optional, default: 0

**Error Cases**:
- 400 Bad Request:
  - Missing required fields
  - Prices <= 0
  - MRP < cost_price
  - Invalid data types
- 500 Internal Server Error: Database insertion error

---

#### Update Medicine
**Endpoint**: `PUT /inventory/medicines/{medicine_id}`

**Description**: Updates an existing medicine. Status is automatically recalculated.

**Path Parameters**:
- `medicine_id` (required, integer): The medicine ID

**Request Body**: Same as Add Medicine endpoint

**Response** (200 OK):
```json
{
  "id": 1,
  "medicine_name": "Aspirin 500mg",
  "generic_name": "Acetylsalicylic Acid",
  "category": "Pain Relief",
  "batch_no": "BATCH001",
  "expiry_date": "2027-02-27",
  "quantity": 145,
  "cost_price": 2.50,
  "mrp": 5.00,
  "supplier": "PharmaCo",
  "status": "Active",
  "created_at": "2026-02-27T10:30:00",
  "updated_at": "2026-02-27T10:35:00"
}
```

**Automatic Status Updates**:
- If `expiry_date < today`: Status → "Expired"
- If `quantity == 0`: Status → "Out of Stock"
- If `quantity < 20`: Status → "Low Stock"
- Otherwise: Status → "Active"

**Error Cases**:
- 404 Not Found: Medicine not found
- 400 Bad Request: Invalid data or validation failure
- 500 Internal Server Error: Database update error

---

#### Delete Medicine
**Endpoint**: `DELETE /inventory/medicines/{medicine_id}`

**Description**: Deletes a medicine from inventory.

**Path Parameters**:
- `medicine_id` (required, integer): The medicine ID

**Response** (204 No Content): Empty response body

**Error Cases**:
- 404 Not Found: Medicine not found
- 500 Internal Server Error: Database deletion error

---

### 3. Sales Endpoints

#### Create Sale (with Inventory Deduction)
**Endpoint**: `POST /sales/create-sale`

**Description**: Creates a new sale and automatically decreases inventory for all medicines sold. This is a critical endpoint that ensures data consistency through atomic transactions.

**Request Body**:
```json
{
  "invoice_no": "INV-001",
  "customer_name": "John Doe",
  "items_count": 3,
  "total_amount": 45.50,
  "payment_method": "Cash",
  "items": [
    {
      "medicine_id": 1,
      "quantity": 2
    },
    {
      "medicine_id": 2,
      "quantity": 1
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "invoice_no": "INV-001",
  "customer_name": "John Doe",
  "items_count": 3,
  "total_amount": 45.50,
  "payment_method": "Cash",
  "date": "2026-02-27T10:30:00",
  "status": "Completed",
  "created_at": "2026-02-27T10:30:00"
}
```

**Validation Rules**:
- `invoice_no`: Required, unique (prevents duplicate transactions)
- `customer_name`: Required, non-empty string
- `total_amount`: Required, must be > 0
- `items`: Required, at least 1 item
- Each item's `quantity` must not exceed available medicine quantity

**Data Consistency Process**:

1. **Pre-Transaction Validation**:
   - Verify all medicine IDs exist
   - Check sufficient quantity for each medicine
   - Validate invoice uniqueness

2. **Atomic Transaction**:
   - Create sale record
   - For each item:
     - Decrease medicine quantity
     - Recalculate medicine status
   - Commit all changes or rollback entirely

3. **Post-Transaction**:
   - Return created sale with timestamp
   - Dashboard statistics updated automatically

**Error Cases**:
- 400 Bad Request:
  - Missing required fields
  - Total amount <= 0
  - Invoice number already exists
  - No items in order
  - Insufficient quantity for a medicine
  - Invalid payment method
- 404 Not Found: Medicine ID doesn't exist
- 500 Internal Server Error: Database transaction failure (all changes rolled back)

**Example Flow**:
```
Request:
  POST /sales/create-sale
  Body: {
    "invoice_no": "INV-TEST-001",
    "customer_name": "Patient ABC",
    "items_count": 2,
    "total_amount": 25.00,
    "payment_method": "Cash",
    "items": [
      {"medicine_id": 1, "quantity": 5},
      {"medicine_id": 2, "quantity": 3}
    ]
  }

Processing:
  1. Validate invoice_no doesn't exist
  2. Verify medicine 1 exists with qty >= 5
  3. Verify medicine 2 exists with qty >= 3
  4. Create sale (INV-TEST-001)
  5. Update medicine 1: qty -= 5, recalculate status
  6. Update medicine 2: qty -= 3, recalculate status
  7. Commit transaction

Response (201):
  {
    "id": 1,
    "invoice_no": "INV-TEST-001",
    "customer_name": "Patient ABC",
    "items_count": 2,
    "total_amount": 25.00,
    "payment_method": "Cash",
    "date": "2026-02-27T10:30:00",
    "status": "Completed"
  }

Result:
  - Medicine 1 quantity: 150 → 145
  - Medicine 2 quantity: 100 → 97
  - Status updated if quantities cross thresholds
```

---

### 4. Health Check Endpoint

#### Health Check
**Endpoint**: `GET /health`

**Description**: Simple endpoint to verify API is running.

**Response** (200):
```json
{
  "status": "ok"
}
```

---

## Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Validation error, invalid input |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error, transaction rolled back |

## Rate Limiting

Currently not implemented. For production, consider implementing:
- Per-minute request limits
- Per-user rate limiting
- Throttling for specific endpoints

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:5173` (Frontend dev)
- `http://localhost:3000` (Alternative)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

Production CORS origins can be configured via environment variable `CORS_ORIGINS`.

## Data Types

### Medicine Object
```typescript
{
  id: number,
  medicine_name: string,
  generic_name: string,
  category: string,
  batch_no: string,
  expiry_date: string (YYYY-MM-DD),
  quantity: number,
  cost_price: number (2 decimal places),
  mrp: number (2 decimal places),
  supplier: string,
  status: "Active" | "Low Stock" | "Expired" | "Out of Stock",
  created_at?: string (ISO 8601),
  updated_at?: string (ISO 8601)
}
```

### Sale Object
```typescript
{
  id: number,
  invoice_no: string,
  customer_name: string,
  items_count: number,
  total_amount: number (2 decimal places),
  payment_method: "Cash" | "Card" | "UPI",
  date: string (ISO 8601),
  status: "Completed" | "Pending",
  created_at?: string (ISO 8601)
}
```

### Sale Item Object
```typescript
{
  medicine_id: number,
  quantity: number
}
```

## Testing with cURL

### Get Dashboard Stats
```bash
curl -X GET http://localhost:8000/api/dashboard/stats
```

### List Medicines
```bash
curl -X GET "http://localhost:8000/api/inventory/medicines?search=aspirin&limit=10"
```

### Add Medicine
```bash
curl -X POST http://localhost:8000/api/inventory/medicines \
  -H "Content-Type: application/json" \
  -d '{
    "medicine_name": "Test Medicine",
    "generic_name": "Test Generic",
    "category": "Test",
    "batch_no": "BATCH123",
    "expiry_date": "2027-12-31",
    "quantity": 100,
    "cost_price": 10.00,
    "mrp": 20.00,
    "supplier": "Test Supplier"
  }'
```

### Create Sale
```bash
curl -X POST http://localhost:8000/api/sales/create-sale \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_no": "INV-TEST-001",
    "customer_name": "Test Customer",
    "items_count": 2,
    "total_amount": 45.50,
    "payment_method": "Cash",
    "items": [
      {"medicine_id": 1, "quantity": 2},
      {"medicine_id": 2, "quantity": 1}
    ]
  }'
```

## Pagination

For large datasets, use pagination parameters:

```bash
# Get first 10 medicines
GET /inventory/medicines?skip=0&limit=10

# Get next 10 medicines
GET /inventory/medicines?skip=10&limit=10
```

## Filtering

Use search parameter to filter medicines:

```bash
# Search by medicine name
GET /inventory/medicines?search=aspirin

# Search by generic name
GET /inventory/medicines?search=acetyl
```

Search is case-insensitive and searches both `medicine_name` and `generic_name` fields.

---

**Last Updated**: February 27, 2026  
**API Version**: 1.0.0  
**Status**: Production Ready
