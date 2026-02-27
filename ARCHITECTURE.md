# Pharmacy CRM - System Architecture

## Overview

The Pharmacy CRM follows a modern three-tier architecture with separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)               │
│  ├─ Dashboard Page (Sales & Inventory Overview)         │
│  ├─ Inventory Page (CRUD Operations)                    │
│  └─ API Service Layer (Centralized axios)              │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST
                   │ Port 8000
┌──────────────────▼──────────────────────────────────────┐
│              Backend (FastAPI + Python)                 │
│  ├─ Route Layer (API Endpoints)                         │
│  ├─ Business Logic (Transactions, Validation)           │
│  ├─ Data Layer (SQLAlchemy ORM)                         │
│  └─ Database (SQLite/PostgreSQL)                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Database Layer                             │
│  ├─ Medicine Table                                      │
│  ├─ Sale Table                                          │
│  └─ Indexes & Constraints                              │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Structure

```
App.jsx (Router)
├── Dashboard.jsx
│   ├── Stats Cards (4 cards with real-time data)
│   ├── Recent Sales List
│   ├── Make a Sale Section
│   └── Sale Modal
│       ├── Form (Invoice, Customer, Payment)
│       ├── Medicine Search
│       ├── Shopping Cart
│       └── Cart Summary
└── Inventory.jsx
    ├── Overview Cards (4 cards with statistics)
    ├── Search & Filter Controls
    ├── Inventory Table
    │   ├── Column: Medicine Name
    │   ├── Column: Generic Name
    │   ├── Column: Status Indicator
    │   ├── Column: Actions (Edit, Delete)
    │   └── More columns...
    └── Add/Edit Modal
        ├── Form Fields (9 inputs)
        └── Submit Handler
```

### State Management

**Dashboard.jsx**:
- `stats`: Dashboard statistics (sales, items, stock)
- `recentSales`: Last 5 transactions
- `medicines`: Available medicines for cart
- `saleCart`: Items in shopping cart
- `loading`: Data loading state
- `submitting`: Form submission state
- `error/success`: User notifications

**Inventory.jsx**:
- `medicines`: All medicines inventory
- `searchTerm`: Search filter input
- `loading`: Data loading state
- `submitting`: Form submission state
- `formData`: Current form being edited
- `editingId`: ID of medicine being edited
- `error/success`: User notifications

### Data Flow

```
User Action
    ↓
Component Handler
    ↓
API Utility (axios)
    ↓
Interceptors (logging, error handling)
    ↓
Backend API
    ↓
Response Processing
    ↓
State Update
    ↓
Component Re-render
```

## Backend Architecture

### Layered Architecture

```
1. Route Layer (main.py)
   ├─ GET /api/dashboard/stats
   ├─ GET /api/dashboard/recent-sales
   ├─ GET /api/inventory/medicines
   ├─ POST /api/inventory/medicines
   ├─ PUT /api/inventory/medicines/{id}
   ├─ DELETE /api/inventory/medicines/{id}
   └─ POST /api/sales/create-sale

       ↓

2. Business Logic Layer (main.py functions)
   ├─ Data Validation
   ├─ Business Rule Enforcement
   ├─ Status Calculation
   ├─ Inventory Management
   └─ Transaction Management

       ↓

3. Schema Layer (schemas.py)
   ├─ Input Validation (Pydantic)
   ├─ Type Conversion
   ├─ Response Models
   └─ Documentation

       ↓

4. ORM Layer (models.py + database.py)
   ├─ Medicine Model
   ├─ Sale Model
   ├─ Relationships
   └─ Database Session Management

       ↓

5. Database Layer (SQLite/PostgreSQL)
   ├─ medicines table
   ├─ sales table
   ├─ Indexes
   └─ Constraints
```

### Request Processing Flow

```
HTTP Request
    ↓
CORS Middleware
    ↓
Route Matching
    ↓
Parameter Extraction
    ↓
Schema Validation (Pydantic)
    ↓
Database Session Dependency Injection
    ↓
Business Logic Execution
    ↓
Transaction Management
    ↓
Response Serialization
    ↓
HTTP Response
```

## Data Model

### Medicine Model

```python
class Medicine:
    id: int (Primary Key, Auto-increment)
    medicine_name: str (Indexed, Required)
    generic_name: str (Required)
    category: str (Optional)
    batch_no: str (Required, Unique per medicine)
    expiry_date: date (Required)
    quantity: int (Default: 0, Required)
    cost_price: float (Required, > 0)
    mrp: float (Required, >= cost_price)
    supplier: str (Required)
    status: str (Auto-calculated)
    created_at: datetime (Auto-set)
    updated_at: datetime (Auto-updated)
```

### Sale Model

```python
class Sale:
    id: int (Primary Key, Auto-increment)
    invoice_no: str (Unique, Required, Indexed)
    customer_name: str (Required)
    items_count: int (Required)
    total_amount: float (Required)
    payment_method: str (Required, Enum: Cash/Card/UPI)
    date: datetime (Auto-set)
    status: str (Default: "Completed")
    created_at: datetime (Auto-set)
```

### Sale Items (Request Only)

```python
class SaleItem:
    medicine_id: int (Foreign Key reference)
    quantity: int (Required, > 0)
```

## Database Schema

### medicines table

```sql
CREATE TABLE medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name VARCHAR NOT NULL INDEXED,
    generic_name VARCHAR NOT NULL,
    category VARCHAR,
    batch_no VARCHAR NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price FLOAT NOT NULL,
    mrp FLOAT NOT NULL,
    supplier VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### sales table

```sql
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no VARCHAR UNIQUE NOT NULL INDEXED,
    customer_name VARCHAR NOT NULL,
    items_count INTEGER NOT NULL,
    total_amount FLOAT NOT NULL,
    payment_method VARCHAR NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'Completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Key Architectural Decisions

### 1. Centralized API Utility (frontend/src/utils/api.js)

**Why**: 
- Single point of control for all API calls
- Centralized error handling
- Request/response interceptors
- Easier to maintain and debug

**Implementation**:
```javascript
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(...)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(...)
```

### 2. Status Auto-Calculation (backend)

**Why**:
- Prevents stale status data
- Single source of truth
- Automatic updates on inventory changes
- Helper function reduces code duplication

**Implementation**:
```python
def get_medicine_status(quantity: int, expiry_date: date) -> str:
    if expiry_date < date.today():
        return "Expired"
    elif quantity == 0:
        return "Out of Stock"
    elif quantity < 20:
        return "Low Stock"
    return "Active"
```

### 3. Atomic Transactions for Sales

**Why**:
- Ensures data consistency
- Prevents partial updates
- Guarantees inventory accuracy
- All-or-nothing semantics

**Implementation**:
```python
try:
    db.add(sale)
    db.commit()
    
    for item in items:
        medicine.quantity -= item.quantity
        update_medicine_status(medicine)
    
    db.commit()
except Exception:
    db.rollback()
    raise
```

### 4. Separate API Utility Layer

**Why**:
- Decouples components from API implementation
- Easy to mock for testing
- Easy to swap API client library
- Centralized configuration

### 5. Pydantic Schemas for Validation

**Why**:
- Automatic type checking
- Built-in validation
- OpenAPI documentation generation
- Better error messages

## Security Architecture

### Input Validation

```
User Input
    ↓
Frontend Validation (immediate feedback)
    ├─ Type checking
    ├─ Required field validation
    ├─ Range validation
    └─ Format validation
    ↓
API Submission
    ↓
Backend Pydantic Validation
    ├─ Type coercion
    ├─ Constraint checking
    └─ Business rule validation
    ↓
Database Constraints
    ├─ NOT NULL constraints
    ├─ UNIQUE constraints
    ├─ CHECK constraints
    └─ Foreign key constraints
```

### Error Handling

```
Error Occurs
    ↓
Try-Catch Block
    ↓
Error Classification
    ├─ Validation Error → 400
    ├─ Not Found → 404
    ├─ Transaction Error → 500 (with rollback)
    └─ Other → 500
    ↓
Error Response (no sensitive info)
    ↓
Frontend Error Display
    ↓
User-Friendly Message
```

## Performance Considerations

### Database Optimization

1. **Indexes**:
   - `medicine_name` (frequent searches)
   - `invoice_no` (unique constraint index)

2. **Query Optimization**:
   - Use `.filter().first()` instead of `.filter().all()`
   - Limit result sets with pagination
   - Use `.count()` for aggregations

3. **Connection Pooling**:
   - Reuse database connections
   - Configurable pool size

### Frontend Optimization

1. **API Calls**:
   - Parallel requests with `Promise.all()`
   - Search debouncing
   - Pagination for large datasets

2. **Component Optimization**:
   - Memoization where needed
   - Efficient re-renders
   - Lazy loading (future enhancement)

3. **Bundle Optimization**:
   - Tree shaking (Vite handles)
   - CSS minification (Tailwind)
   - Code splitting (future enhancement)

## Scalability Considerations

### Future Enhancements

1. **Database Migration**:
   - SQLite → PostgreSQL for production
   - Better concurrency support
   - Automatic backups

2. **Caching Layer**:
   - Redis for frequent queries
   - Cache dashboard statistics
   - Invalidation strategy

3. **API Gateway**:
   - Rate limiting
   - API versioning
   - Load balancing

4. **Message Queue**:
   - Background jobs for reports
   - Async notifications
   - Event logging

5. **Microservices** (if needed):
   - Inventory Service
   - Sales Service
   - Analytics Service

## Deployment Architecture

```
Git Repository (GitHub)
    ↓
CD Pipeline (GitHub Actions)
    ├─ Frontend → Vercel
    └─ Backend → Railway/Render
    ↓
Production Environment
    ├─ Frontend: CDN + Edge Functions
    ├─ Backend: Containerized
    └─ Database: Managed PostgreSQL
```

---

**Last Updated**: February 27, 2026  
**Version**: 1.0.0
