from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db
from datetime import date, datetime
from sqlalchemy import func
import os

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pharmacy CRM API", version="1.0.0")

# Configure CORS based on environment
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://pharmacy-crm-six.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Helper Functions
# ==========================================

def update_medicine_status(medicine: models.Medicine) -> None:
    """Update medicine status based on quantity and expiry date"""
    medicine.status = models.get_medicine_status(medicine.quantity, medicine.expiry_date)

# ==========================================
# DASHBOARD APIs
# ==========================================

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics for today"""
    today = date.today()
    
    todays_sales_query = db.query(func.sum(models.Sale.total_amount)).filter(
        func.date(models.Sale.date) == today
    ).scalar()
    todays_sales = todays_sales_query or 0
    
    items_sold_query = db.query(func.sum(models.Sale.items_count)).filter(
        func.date(models.Sale.date) == today
    ).scalar()
    items_sold = items_sold_query or 0
    
    low_stock = db.query(models.Medicine).filter(models.Medicine.status == "Low Stock").count()
    
    # Get total inventory value (by cost price)
    purchase_orders = db.query(func.sum(models.Medicine.quantity * models.Medicine.cost_price)).scalar() or 0
    
    return {
        "todays_sales": float(todays_sales),
        "items_sold_today": int(items_sold) if items_sold else 0,
        "low_stock_items": low_stock,
        "purchase_orders": float(purchase_orders)
    }

@app.get("/api/dashboard/recent-sales", response_model=list[schemas.SaleResponse])
def get_recent_sales(limit: int = 5, db: Session = Depends(get_db)):
    """Get recent sales with optional limit"""
    sales = db.query(models.Sale).order_by(models.Sale.date.desc()).limit(limit).all()
    return sales

# ==========================================
# INVENTORY APIs
# ==========================================

@app.get("/api/inventory/medicines", response_model=list[schemas.MedicineResponse])
def list_medicines(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db)):
    """List all medicines with optional search and pagination"""
    query = db.query(models.Medicine)
    if search:
        query = query.filter(
            (models.Medicine.medicine_name.ilike(f"%{search}%")) |
            (models.Medicine.generic_name.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()

@app.get("/api/inventory/medicines/{medicine_id}", response_model=schemas.MedicineResponse)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    """Get a specific medicine by ID"""
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return db_medicine

@app.post("/api/inventory/medicines", response_model=schemas.MedicineResponse, status_code=201)
def add_medicine(medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    """Add a new medicine to inventory"""
    # Validate required fields
    if not medicine.medicine_name or not medicine.generic_name:
        raise HTTPException(status_code=400, detail="Medicine name and generic name are required")
    
    if medicine.mrp <= 0 or medicine.cost_price <= 0:
        raise HTTPException(status_code=400, detail="Prices must be greater than 0")
    
    if medicine.mrp < medicine.cost_price:
        raise HTTPException(status_code=400, detail="MRP must be greater than or equal to cost price")
    
    # Determine status using helper function
    status = models.get_medicine_status(medicine.quantity, medicine.expiry_date)
    
    db_medicine = models.Medicine(
        **medicine.model_dump(),
        status=status
    )
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.put("/api/inventory/medicines/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(medicine_id: int, medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    """Update an existing medicine"""
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    # Validate prices
    if medicine.mrp <= 0 or medicine.cost_price <= 0:
        raise HTTPException(status_code=400, detail="Prices must be greater than 0")
    
    if medicine.mrp < medicine.cost_price:
        raise HTTPException(status_code=400, detail="MRP must be greater than or equal to cost price")
    
    for key, value in medicine.model_dump().items():
        setattr(db_medicine, key, value)
    
    # Update status using helper function
    update_medicine_status(db_medicine)
        
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.delete("/api/inventory/medicines/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    """Delete a medicine from inventory"""
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    db.delete(db_medicine)
    db.commit()
    return None

# ==========================================
# SALES APIs
# ==========================================

@app.post("/api/sales/create-sale", response_model=schemas.SaleResponse, status_code=201)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    """Create a new sale and update inventory"""
    if not sale.invoice_no or not sale.customer_name:
        raise HTTPException(status_code=400, detail="Invoice number and customer name are required")
    
    if sale.total_amount <= 0:
        raise HTTPException(status_code=400, detail="Total amount must be greater than 0")
    
    # Check if invoice already exists
    existing_sale = db.query(models.Sale).filter(models.Sale.invoice_no == sale.invoice_no).first()
    if existing_sale:
        raise HTTPException(status_code=400, detail="Invoice number already exists")
    
    # Validate medicine items
    if not sale.items or len(sale.items) == 0:
        raise HTTPException(status_code=400, detail="Sale must contain at least one medicine")
    
    try:
        # Validate all medicines exist and have sufficient quantity
        for item in sale.items:
            medicine = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
            if not medicine:
                raise HTTPException(status_code=404, detail=f"Medicine with ID {item.medicine_id} not found")
            if medicine.quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient quantity for {medicine.medicine_name}. Available: {medicine.quantity}, Requested: {item.quantity}")
        
        # Create the sale
        db_sale = models.Sale(
            invoice_no=sale.invoice_no,
            customer_name=sale.customer_name,
            items_count=sale.items_count,
            total_amount=sale.total_amount,
            payment_method=sale.payment_method,
            status="Completed"
        )
        db.add(db_sale)
        db.commit()
        
        # Decrease inventory and update status for each medicine
        for item in sale.items:
            medicine = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
            medicine.quantity -= item.quantity
            update_medicine_status(medicine)
            db.add(medicine)
        
        db.commit()
        db.refresh(db_sale)
        return db_sale
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating sale: {str(e)}")

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}