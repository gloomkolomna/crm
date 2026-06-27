from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import ShippingMethod, User
from schemas import ShippingMethod as ShippingMethodSchema, ShippingMethodCreate
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/shipping-methods",
    tags=["Способы доставки"],
)

@router.get("/", response_model=List[ShippingMethodSchema])
def read_shipping_methods(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ShippingMethod).offset(skip).limit(limit).all()

@router.post("/", response_model=ShippingMethodSchema)
def create_shipping_method(data: ShippingMethodCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    method = ShippingMethod(name=data.name, is_active=data.is_active)
    db.add(method)
    db.commit()
    db.refresh(method)
    return method

@router.put("/{method_id}", response_model=ShippingMethodSchema)
def update_shipping_method(method_id: int, data: ShippingMethodCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    method = db.query(ShippingMethod).filter(ShippingMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Способ доставки не найден")
    method.name = data.name
    method.is_active = data.is_active
    db.commit()
    db.refresh(method)
    return method

@router.delete("/{method_id}")
def delete_shipping_method(method_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    method = db.query(ShippingMethod).filter(ShippingMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Способ доставки не найден")
    db.delete(method)
    db.commit()
    return {"message": "Способ доставки удалён"}