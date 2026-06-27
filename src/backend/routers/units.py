from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import UnitType, User
from schemas import UnitType as UnitTypeSchema, UnitTypeCreate
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/units",
    tags=["Единицы измерения"],
)


@router.get("/", response_model=List[UnitTypeSchema])
def read_units(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UnitType).offset(skip).limit(limit).all()


@router.post("/", response_model=UnitTypeSchema)
def create_unit(unit: UnitTypeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_unit = UnitType(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/{unit_id}", response_model=UnitTypeSchema)
def read_unit(unit_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unit = db.query(UnitType).filter(UnitType.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Единица измерения не найдена")
    return unit


@router.put("/{unit_id}", response_model=UnitTypeSchema)
def update_unit(unit_id: int, unit: UnitTypeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_unit = db.query(UnitType).filter(UnitType.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Единица измерения не найдена")
    for key, value in unit.model_dump().items():
        setattr(db_unit, key, value)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/{unit_id}")
def delete_unit(unit_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unit = db.query(UnitType).filter(UnitType.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Единица измерения не найдена")
    db.delete(unit)
    db.commit()
    return {"message": "Единица измерения удалена"}