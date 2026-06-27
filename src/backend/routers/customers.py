from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Customer, User
from schemas import Customer as CustomerSchema, CustomerCreate
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/customers",
    tags=["Клиенты"],
)

@router.get("/", response_model=List[CustomerSchema])
def read_customers(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=CustomerSchema)
def create_customer(customer: CustomerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}", response_model=CustomerSchema)
def read_customer(customer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return customer

@router.put("/{customer_id}", response_model=CustomerSchema)
def update_customer(customer_id: int, customer: CustomerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    for key, value in customer.model_dump().items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    db.delete(customer)
    db.commit()
    return {"message": "Клиент удалён"}
