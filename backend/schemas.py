from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# --- Medicine Schemas ---
class MedicineBase(BaseModel):
    medicine_name: str
    generic_name: str
    category: str
    batch_no: str
    expiry_date: date
    quantity: int
    cost_price: float
    mrp: float
    supplier: str

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: int
    status: Optional[str] = None
    class Config:
        from_attributes = True

# --- Sale Item Schema ---
class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int

# --- Sale Schemas ---
class SaleBase(BaseModel):
    invoice_no: str
    customer_name: str
    items_count: int
    total_amount: float
    payment_method: str

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]  # Add items list

class SaleResponse(SaleBase):
    id: int
    date: datetime
    status: str

    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    todays_sales: float
    items_sold_today: int
    low_stock_items: int
    purchase_orders: float