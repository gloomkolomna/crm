from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
from models import Material, Category, UnitType, MaterialBatch
from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(
    prefix="/api/materials",
    tags=["Материалы"],
)


# Получение списка единиц измерения
@router.get("/units/")
def get_unit_types(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    units = db.query(UnitType).all()
    return [{"id": u.id, "name": u.name} for u in units]


@router.get("/")
def read_materials(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    material_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Material)
    if category_id:
        query = query.filter(Material.category_id == category_id)
    if material_type:
        query = query.filter(Material.material_type == material_type)
    materials = query.offset(skip).limit(limit).all()

    result = []
    for m in materials:
        material_data = {
            "id": m.id,
            "name": m.name,
            "category_id": m.category_id,
            "category_name": m.category.name if m.category else None,
            "unit_id": m.unit_id,
            "unit_name": m.unit.name if m.unit else None,
            "url": m.url,
            "article": m.article,
            "current_stock": m.current_stock,
            "min_stock": m.min_stock,
            "average_cost": m.average_cost,
            "material_type": m.material_type,
        }
        result.append(material_data)
    return result


@router.post("/")
def create_material(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = Material(
        name=data.get("name"),
        category_id=data.get("category_id"),
        unit_id=data.get("unit_id"),
        url=data.get("url"),
        article=data.get("article"),
        current_stock=0,
        min_stock=data.get("min_stock"),
        average_cost=0,
        material_type=data.get("material_type", "common")
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/{material_id}")
def read_material(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    batches = db.query(MaterialBatch).filter(MaterialBatch.material_id == material_id).order_by(MaterialBatch.purchase_date.desc()).all()

    return {
        "id": material.id,
        "name": material.name,
        "category_id": material.category_id,
        "category_name": material.category.name if material.category else None,
        "unit_id": material.unit_id,
        "unit_name": material.unit.name if material.unit else None,
        "url": material.url,
        "article": material.article,
        "current_stock": material.current_stock,
        "min_stock": material.min_stock,
        "average_cost": material.average_cost,
        "material_type": material.material_type,
        "batches": [
            {
                "id": b.id,
                "quantity": b.quantity,
                "total_cost": b.total_cost,
                "cost_per_unit": b.total_cost / b.quantity if b.quantity > 0 else 0,
                "purchase_date": str(b.purchase_date)
            }
            for b in batches
        ]
    }


@router.put("/{material_id}")
def update_material(material_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    material.name = data.get("name", material.name)
    material.category_id = data.get("category_id", material.category_id)
    material.unit_id = data.get("unit_id", material.unit_id)
    material.url = data.get("url", material.url)
    material.article = data.get("article", material.article)
    material.min_stock = data.get("min_stock", material.min_stock)
    material.material_type = data.get("material_type", material.material_type)

    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}")
def delete_material(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")
    try:
        db.delete(material)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Невозможно удалить материал: он используется в спецификациях продукции, оборудования, браке или других записях. Сначала удалите все ссылки на этот материал."
        )
    return {"message": "Материал удалён"}


# ==================== ЗАКУПКИ ====================

@router.get("/{material_id}/batches/")
def get_material_batches(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    batches = db.query(MaterialBatch).filter(MaterialBatch.material_id == material_id).order_by(MaterialBatch.purchase_date.desc()).all()
    return [
        {
            "id": b.id,
            "quantity": b.quantity,
            "total_cost": b.total_cost,
            "cost_per_unit": b.total_cost / b.quantity if b.quantity > 0 else 0,
            "purchase_date": str(b.purchase_date)
        }
        for b in batches
    ]


@router.post("/{material_id}/batches/")
def add_material_batch(material_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    quantity = data.get("quantity", 0)
    total_cost = data.get("total_cost", 0)

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Количество должно быть больше 0")

    # Преобразуем строку даты в объект date
    purchase_date_str = data.get("purchase_date")
    if purchase_date_str:
        purchase_date_obj = datetime.strptime(purchase_date_str, "%Y-%m-%d").date()
    else:
        purchase_date_obj = datetime.now().date()

    batch = MaterialBatch(
        material_id=material_id,
        quantity=quantity,
        total_cost=total_cost,
        purchase_date=purchase_date_obj
    )
    db.add(batch)

    material.current_stock += quantity

    all_batches = db.query(MaterialBatch).filter(MaterialBatch.material_id == material_id).all()
    total_quantity = sum(b.quantity for b in all_batches) + quantity
    total_cost_sum = sum(b.total_cost for b in all_batches) + total_cost
    material.average_cost = total_cost_sum / total_quantity if total_quantity > 0 else 0

    db.commit()
    db.refresh(batch)

    return {
        "id": batch.id,
        "quantity": batch.quantity,
        "total_cost": batch.total_cost,
        "cost_per_unit": total_cost / quantity,
        "purchase_date": str(batch.purchase_date)
    }


@router.put("/{material_id}/batches/{batch_id}")
def update_material_batch(material_id: int, batch_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id, MaterialBatch.material_id == material_id).first()
    if batch is None:
        raise HTTPException(status_code=404, detail="Закупка не найдена")

    old_quantity = batch.quantity
    old_total_cost = batch.total_cost

    new_quantity = data.get("quantity", batch.quantity)
    new_total_cost = data.get("total_cost", batch.total_cost)
    new_purchase_date_str = data.get("purchase_date")

    if new_quantity <= 0:
        raise HTTPException(status_code=400, detail="Количество должно быть больше 0")

    batch.quantity = new_quantity
    batch.total_cost = new_total_cost
    if new_purchase_date_str:
        batch.purchase_date = datetime.strptime(new_purchase_date_str, "%Y-%m-%d").date()

    material.current_stock += new_quantity - old_quantity

    all_batches = db.query(MaterialBatch).filter(MaterialBatch.material_id == material_id).all()
    total_quantity = sum(b.quantity for b in all_batches)
    total_cost_sum = sum(b.total_cost for b in all_batches)
    material.average_cost = total_cost_sum / total_quantity if total_quantity > 0 else 0

    db.commit()
    db.refresh(batch)

    return {
        "id": batch.id,
        "quantity": batch.quantity,
        "total_cost": batch.total_cost,
        "cost_per_unit": batch.total_cost / batch.quantity if batch.quantity > 0 else 0,
        "purchase_date": str(batch.purchase_date)
    }


@router.delete("/{material_id}/batches/{batch_id}")
def delete_material_batch(material_id: int, batch_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id, MaterialBatch.material_id == material_id).first()
    if batch is None:
        raise HTTPException(status_code=404, detail="Закупка не найдена")

    material.current_stock -= batch.quantity

    db.delete(batch)

    remaining = db.query(MaterialBatch).filter(MaterialBatch.material_id == material_id).all()
    total_quantity = sum(b.quantity for b in remaining)
    total_cost_sum = sum(b.total_cost for b in remaining)
    material.average_cost = total_cost_sum / total_quantity if total_quantity > 0 else 0

    db.commit()
    return {"message": "Закупка удалена"}