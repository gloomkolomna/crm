from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Material, Product, ProductSpecification, ProductEquipmentSpecification, ProductionAct, User
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/reports",
    tags=["Отчёты"],
)


@router.get("/material-stocks/")
def get_material_stocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    materials = db.query(Material).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "current_stock": m.current_stock,
            "min_stock": m.min_stock,
            "unit": m.unit.name if m.unit else None
        }
        for m in materials
    ]


@router.get("/products/")
def get_products_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []

    for p in products:
        mat_specs = db.query(ProductSpecification).filter(ProductSpecification.product_id == p.id).all()
        eq_specs = db.query(ProductEquipmentSpecification).filter(ProductEquipmentSpecification.product_id == p.id).all()

        material_cost = 0
        equipment_cost = 0

        for spec in mat_specs:
            material = db.query(Material).filter(Material.id == spec.material_id).first()
            if material:
                material_cost += spec.quantity * material.average_cost

        for spec in eq_specs:
            equipment_cost += spec.depreciation_per_unit

        total_cost = material_cost + equipment_cost

        prod_acts = db.query(ProductionAct).filter(ProductionAct.product_id == p.id).all()
        avg_unit_cost = 0
        total_produced = 0
        if prod_acts:
            total_produced = sum(a.quantity for a in prod_acts)
            total_cost_produced = sum(a.total_cost for a in prod_acts)
            avg_unit_cost = total_cost_produced / total_produced if total_produced > 0 else 0

        result.append({
            "id": p.id,
            "name": p.name,
            "spec_material_cost": material_cost,
            "spec_equipment_cost": equipment_cost,
            "spec_total_cost": total_cost,
            "avg_unit_cost": avg_unit_cost,
            "total_produced": total_produced,
        })

    return result
