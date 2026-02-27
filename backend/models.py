from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from database import Base
import datetime

# Helper function to determine medicine status
def get_medicine_status(quantity: int, expiry_date: datetime.date) -> str:
    """Determine medicine status based on quantity and expiry date"""
    if expiry_date < datetime.date.today():
        return "Expired"
    elif quantity == 0:
        return "Out of Stock"
    elif quantity < 20:
        return "Low Stock"
    return "Active"

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, index=True, nullable=False)
    generic_name = Column(String, nullable=False)
    category = Column(String)
    batch_no = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    cost_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    supplier = Column(String, nullable=False)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    items_count = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)