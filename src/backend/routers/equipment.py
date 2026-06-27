from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from models import Equipment, EquipmentSpecification, EquipmentConsumption, Material, User
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/equipment",
    tags=["Оборудование"],
)


@router.get("/")
def read_equipment(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).offset(skip).limit(limit).all()
    result = []
    for e in equipment:
        specs = db.query(EquipmentSpecification).filter(EquipmentSpecification.equipment_id == e.id).all()
        specifications = []
        for s in specs:
            material = db.query(Material).filter(Material.id == s.material_id).first()
            specifications.append({
                "id": s.id,
                "material_id": s.material_id,
                "material_name": material.name if material else None,
                "resource_type": s.resource_type,
                "total_resource": s.total_resource,
                "current_resource": s.current_resource,
                "min_resource": s.min_resource,
                "consumption_per_unit": s.consumption_per_unit,
            })

        result.append({
            "id": e.id,
            "name": e.name,
            "cost": e.cost,
            "specifications": specifications,
            "created_at": str(e.created_at),
        })
    return result


@router.post("/")
def create_equipment(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = Equipment(
        name=data.get("name"),
        cost=data.get("cost", 0)
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/{equipment_id}")
def read_equipment_by_id(equipment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")

    specs = db.query(EquipmentSpecification).filter(EquipmentSpecification.equipment_id == equipment_id).all()
    specifications = []
    for s in specs:
        material = db.query(Material).filter(Material.id == s.material_id).first()
        specifications.append({
            "id": s.id,
            "material_id": s.material_id,
            "material_name": material.name if material else None,
            "resource_type": s.resource_type,
            "total_resource": s.total_resource,
            "current_resource": s.current_resource,
            "min_resource": s.min_resource,
            "consumption_per_unit": s.consumption_per_unit,
        })

    return {
        "id": equipment.id,
        "name": equipment.name,
        "cost": equipment.cost,
        "specifications": specifications,
    }


@router.put("/{equipment_id}")
def update_equipment(equipment_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")
    equipment.name = data.get("name", equipment.name)
    equipment.cost = data.get("cost", equipment.cost)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")
    db.delete(equipment)
    db.commit()
    return {"message": "Оборудование удалено"}


@router.post("/{equipment_id}/specification/")
def add_specification(equipment_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")

    material = db.query(Material).filter(Material.id == data.get("material_id")).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")

    spec = EquipmentSpecification(
        equipment_id=equipment_id,
        material_id=data.get("material_id"),
        resource_type=data.get("resource_type", "percent"),
        total_resource=data.get("total_resource", 100),
        current_resource=data.get("current_resource", 100),
        min_resource=data.get("min_resource", 0),
        consumption_per_unit=data.get("consumption_per_unit", 0)
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)

    return {
        "id": spec.id,
        "material_id": spec.material_id,
        "material_name": material.name,
        "resource_type": spec.resource_type,
        "total_resource": spec.total_resource,
        "current_resource": spec.current_resource,
        "min_resource": spec.min_resource,
        "consumption_per_unit": spec.consumption_per_unit,
    }


@router.delete("/{equipment_id}/specification/{spec_id}/")
def remove_specification(equipment_id: int, spec_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    spec = db.query(EquipmentSpecification).filter(
        EquipmentSpecification.id == spec_id,
        EquipmentSpecification.equipment_id == equipment_id
    ).first()
    if spec is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    db.delete(spec)
    db.commit()
    return {"message": "Расходник удалён из спецификации"}


@router.get("/{equipment_id}/consumption/")
def get_consumption_history(equipment_id: int, days: int = 30, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")

    start_date = datetime.now().date() - timedelta(days=days)

    consumption = db.query(EquipmentConsumption).filter(
        EquipmentConsumption.equipment_id == equipment_id,
        EquipmentConsumption.consumption_date >= start_date
    ).order_by(EquipmentConsumption.consumption_date).all()

    result = {}
    for c in consumption:
        date_str = str(c.consumption_date)
        if date_str not in result:
            result[date_str] = {}
        material = db.query(Material).filter(Material.id == c.material_id).first()
        material_name = material.name if material else f"ID:{c.material_id}"
        if material_name not in result[date_str]:
            result[date_str][material_name] = 0
        result[date_str][material_name] += c.quantity_consumed

    chart_data = []
    for date_str, materials in sorted(result.items()):
        entry = {"date": date_str}
        entry.update(materials)
        chart_data.append(entry)

    return {
        "equipment_id": equipment_id,
        "equipment_name": equipment.name,
        "days": days,
        "data": chart_data
    }


@router.post("/{equipment_id}/specification/{spec_id}/replenish/")
def replenish_resource(equipment_id: int, spec_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    spec = db.query(EquipmentSpecification).filter(
        EquipmentSpecification.id == spec_id,
        EquipmentSpecification.equipment_id == equipment_id
    ).first()
    if spec is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    resource_added = data.get("resource_added", 0)

    spec.current_resource = min(spec.current_resource + resource_added, spec.total_resource)

    db.commit()
    db.refresh(spec)

    return {
        "id": spec.id,
        "current_resource": spec.current_resource,
        "total_resource": spec.total_resource,
        "resource_added": resource_added,
    }
