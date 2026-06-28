from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Product, ProductSpecification, ProductEquipmentSpecification, EquipmentSpecification, Material, Equipment, User
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/products",
    tags=["Продукты"],
)


@router.get("/")
def read_products(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    return products


@router.post("/")
def create_product(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = Product(name=data.get("name"), sale_price=data.get("sale_price"))
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}")
def read_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return product


@router.put("/{product_id}")
def update_product(product_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    product.name = data.get("name", product.name)
    if "sale_price" in data:
        product.sale_price = data.get("sale_price")
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    db.delete(product)
    db.commit()
    return {"message": "Продукт удалён"}


@router.get("/{product_id}/materials/")
def get_product_materials(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получить список материалов для продукта (спецификация)"""
    specs = db.query(ProductSpecification).filter(ProductSpecification.product_id == product_id).all()
    result = []
    for spec in specs:
        material = db.query(Material).filter(Material.id == spec.material_id).first()
        if material:
            result.append({
                "id": spec.id,
                "material_id": material.id,
                "name": material.name,
                "quantity": spec.quantity,
                "unit_name": material.unit.name if material.unit else None,
                "current_stock": material.current_stock,
                "average_cost": material.average_cost,
            })
    return result


@router.get("/{product_id}/equipment/")
def get_product_equipment(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получить список оборудования для продукта"""
    specs = db.query(ProductEquipmentSpecification).filter(ProductEquipmentSpecification.product_id == product_id).all()
    result = []
    for spec in specs:
        equipment = db.query(Equipment).filter(Equipment.id == spec.equipment_id).first()
        if equipment:
            # Получаем расходники оборудования
            equip_specs = db.query(EquipmentSpecification).filter(EquipmentSpecification.equipment_id == equipment.id).all()
            supplies = []
            for es in equip_specs:
                mat = db.query(Material).filter(Material.id == es.material_id).first()
                if mat:
                    supplies.append({
                        "material_id": mat.id,
                        "name": mat.name,
                        "current_resource": es.current_resource,
                        "total_resource": es.total_resource,
                        "min_resource": es.min_resource,
                        "resource_type": es.resource_type,
                        "consumption_per_unit": es.consumption_per_unit,
                    })
            result.append({
                "id": spec.id,
                "equipment_id": equipment.id,
                "name": equipment.name,
                "depreciation_per_unit": spec.depreciation_per_unit,
                "supplies": supplies,
            })
    return result


# === Спецификация продукта (материалы и оборудование) ===

@router.get("/{product_id}/specification/")
def get_product_specification(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    mat_specs = db.query(ProductSpecification).filter(ProductSpecification.product_id == product_id).all()
    materials = [
        {
            "id": s.id,
            "type": "material",
            "material_id": s.material_id,
            "name": s.material.name if s.material else None,
            "unit_name": s.material.unit.name if s.material and s.material.unit else None,
            "quantity": s.quantity,
            "cost": s.quantity * s.material.average_cost if s.material else 0
        }
        for s in mat_specs
    ]

    eq_specs = db.query(ProductEquipmentSpecification).filter(ProductEquipmentSpecification.product_id == product_id).all()
    equipment = [
        {
            "id": s.id,
            "type": "equipment",
            "equipment_id": s.equipment_id,
            "name": s.equipment.name if s.equipment else None,
            "depreciation_per_unit": s.depreciation_per_unit,
            "cost": s.depreciation_per_unit
        }
        for s in eq_specs
    ]

    all_items = materials + equipment
    total_cost = sum(item["cost"] for item in all_items)

    return {
        "product_id": product.id,
        "product_name": product.name,
        "items": all_items,
        "total_cost": total_cost
    }


@router.post("/{product_id}/specification/materials/")
def add_product_spec_material(product_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    material = db.query(Material).filter(Material.id == data.get("material_id")).first()
    if not material:
        raise HTTPException(status_code=404, detail="Материал не найден")

    spec = ProductSpecification(
        product_id=product_id,
        material_id=data.get("material_id"),
        quantity=data.get("quantity", 0)
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)

    return {
        "id": spec.id,
        "type": "material",
        "material_id": spec.material_id,
        "name": material.name,
        "quantity": spec.quantity,
        "cost": spec.quantity * material.average_cost
    }


@router.post("/{product_id}/specification/equipment/")
def add_product_spec_equipment(product_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    equipment = db.query(Equipment).filter(Equipment.id == data.get("equipment_id")).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Оборудование не найдено")

    spec = ProductEquipmentSpecification(
        product_id=product_id,
        equipment_id=data.get("equipment_id"),
        depreciation_per_unit=data.get("depreciation_per_unit", 0)
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)

    return {
        "id": spec.id,
        "type": "equipment",
        "equipment_id": spec.equipment_id,
        "name": equipment.name,
        "depreciation_per_unit": spec.depreciation_per_unit,
        "cost": spec.depreciation_per_unit
    }


@router.put("/{product_id}/specification/materials/{spec_id}/")
def update_product_spec_material(product_id: int, spec_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    spec = db.query(ProductSpecification).filter(
        ProductSpecification.id == spec_id,
        ProductSpecification.product_id == product_id
    ).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if "quantity" in data:
        spec.quantity = data["quantity"]

    db.commit()
    db.refresh(spec)

    material = db.query(Material).filter(Material.id == spec.material_id).first()
    return {
        "id": spec.id,
        "type": "material",
        "material_id": spec.material_id,
        "name": material.name if material else None,
        "quantity": spec.quantity,
        "cost": spec.quantity * material.average_cost if material else 0
    }


@router.put("/{product_id}/specification/equipment/{spec_id}/")
def update_product_spec_equipment(product_id: int, spec_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    spec = db.query(ProductEquipmentSpecification).filter(
        ProductEquipmentSpecification.id == spec_id,
        ProductEquipmentSpecification.product_id == product_id
    ).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if "depreciation_per_unit" in data:
        spec.depreciation_per_unit = data["depreciation_per_unit"]

    db.commit()
    db.refresh(spec)

    equipment = db.query(Equipment).filter(Equipment.id == spec.equipment_id).first()
    return {
        "id": spec.id,
        "type": "equipment",
        "equipment_id": spec.equipment_id,
        "name": equipment.name if equipment else None,
        "depreciation_per_unit": spec.depreciation_per_unit,
        "cost": spec.depreciation_per_unit
    }


@router.delete("/{product_id}/specification/{spec_type}/{spec_id}/")
def remove_product_spec(product_id: int, spec_type: str, spec_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if spec_type == "material":
        spec = db.query(ProductSpecification).filter(
            ProductSpecification.id == spec_id,
            ProductSpecification.product_id == product_id
        ).first()
    elif spec_type == "equipment":
        spec = db.query(ProductEquipmentSpecification).filter(
            ProductEquipmentSpecification.id == spec_id,
            ProductEquipmentSpecification.product_id == product_id
        ).first()
    else:
        raise HTTPException(status_code=400, detail="Неизвестный тип")

    if not spec:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    db.delete(spec)
    db.commit()
    return {"message": "Удалено из спецификации"}
