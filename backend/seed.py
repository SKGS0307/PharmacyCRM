from database import SessionLocal, engine
import models
from datetime import date, timedelta

# Create tables
models.Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(models.Medicine).count() > 0:
        print("Database already seeded. Skipping...")
        db.close()
        return
    
    # Sample medicines data
    medicines = [
        models.Medicine(
            medicine_name="Aspirin",
            generic_name="Acetylsalicylic Acid",
            category="Pain Relief",
            batch_no="BATCH001",
            expiry_date=date.today() + timedelta(days=365),
            quantity=150,
            cost_price=2.50,
            mrp=5.00,
            supplier="PharmaCo",
            status="Active"
        ),
        models.Medicine(
            medicine_name="Amoxicillin",
            generic_name="Amoxicillin",
            category="Antibiotic",
            batch_no="BATCH002",
            expiry_date=date.today() + timedelta(days=180),
            quantity=15,
            cost_price=8.00,
            mrp=20.00,
            supplier="MediSupply",
            status="Low Stock"
        ),
        models.Medicine(
            medicine_name="Paracetamol",
            generic_name="Acetaminophen",
            category="Pain Relief",
            batch_no="BATCH003",
            expiry_date=date.today() + timedelta(days=90),
            quantity=0,
            cost_price=1.50,
            mrp=3.50,
            supplier="HealthCare Ltd",
            status="Out of Stock"
        ),
        models.Medicine(
            medicine_name="Ibuprofen",
            generic_name="Ibuprofen",
            category="Anti-inflammatory",
            batch_no="BATCH004",
            expiry_date=date.today() + timedelta(days=200),
            quantity=200,
            cost_price=3.00,
            mrp=7.50,
            supplier="MediCare",
            status="Active"
        ),
        models.Medicine(
            medicine_name="Metformin",
            generic_name="Metformin HCL",
            category="Diabetes",
            batch_no="BATCH005",
            expiry_date=date.today() + timedelta(days=300),
            quantity=85,
            cost_price=4.00,
            mrp=12.00,
            supplier="DiabetesPlus",
            status="Active"
        ),
        models.Medicine(
            medicine_name="Atorvastatin",
            generic_name="Atorvastatin",
            category="Cardiology",
            batch_no="BATCH006",
            expiry_date=date.today() + timedelta(days=120),
            quantity=50,
            cost_price=6.00,
            mrp=18.00,
            supplier="CardioHealth",
            status="Active"
        ),
        models.Medicine(
            medicine_name="Omeprazole",
            generic_name="Omeprazole",
            category="Gastro",
            batch_no="BATCH007",
            expiry_date=date.today() - timedelta(days=10),
            quantity=30,
            cost_price=2.50,
            mrp=8.00,
            supplier="GastroMed",
            status="Expired"
        ),
        models.Medicine(
            medicine_name="Cetirizine",
            generic_name="Cetirizine HCL",
            category="Allergy",
            batch_no="BATCH008",
            expiry_date=date.today() + timedelta(days=250),
            quantity=120,
            cost_price=2.00,
            mrp=6.00,
            supplier="AllergyFree",
            status="Active"
        ),
    ]
    
    db.add_all(medicines)
    db.commit()
    
    # Sample sales data
    sales = [
        models.Sale(
            invoice_no="INV001",
            customer_name="John Doe",
            items_count=3,
            total_amount=45.50,
            payment_method="Cash",
            status="Completed"
        ),
        models.Sale(
            invoice_no="INV002",
            customer_name="Jane Smith",
            items_count=5,
            total_amount=120.00,
            payment_method="Card",
            status="Completed"
        ),
        models.Sale(
            invoice_no="INV003",
            customer_name="Michael Johnson",
            items_count=2,
            total_amount=28.50,
            payment_method="UPI",
            status="Completed"
        ),
        models.Sale(
            invoice_no="INV004",
            customer_name="Sarah Williams",
            items_count=4,
            total_amount=95.75,
            payment_method="Cash",
            status="Completed"
        ),
        models.Sale(
            invoice_no="INV005",
            customer_name="Robert Brown",
            items_count=1,
            total_amount=15.00,
            payment_method="Card",
            status="Completed"
        ),
    ]
    
    db.add_all(sales)
    db.commit()
    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()