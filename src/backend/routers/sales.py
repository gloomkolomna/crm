from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from models import Order, OrderItem, Product, Customer, Material, ProductSpecification, ProductEquipmentSpecification, EquipmentSpecification, EquipmentConsumption, User
from schemas import Order as OrderSchema, OrderCreate, OrderUpdate, OrderItem as OrderItemSchema, OrderItemCreate
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/api/sales",
    tags=["Продажи"],
)


@router.get("/orders/", response_model=List[OrderSchema])
def read_orders(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders

@router.post("/orders/", response_model=OrderSchema)
def create_order(order: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/orders/{order_id}", response_model=OrderSchema)
def read_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order

@router.put("/orders/{order_id}", response_model=OrderSchema)
def update_order(order_id: int, order: OrderUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    update_data = order.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/orders/{order_id}")
def delete_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    for item in items:
        _restore_materials_for_order_item(db, item.product_id, item.quantity)

    db.delete(order)
    db.commit()
    return {"message": "Заказ удалён, материалы возвращены на склад"}


@router.get("/orders/{order_id}/items/", response_model=List[OrderItemSchema])
def read_order_items(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    return items


def _deduct_materials_for_order_item(db: Session, product_id: int, quantity: int) -> dict:
    result = {"materials": [], "equipment_depreciation": 0.0}

    specs = db.query(ProductSpecification).filter(ProductSpecification.product_id == product_id).all()
    for spec in specs:
        material = db.query(Material).filter(Material.id == spec.material_id).first()
        if material:
            deduct_qty = spec.quantity * quantity
            if material.current_stock < deduct_qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Недостаточно материала '{material.name}'. Требуется: {deduct_qty}, Доступно: {material.current_stock}"
                )
            material.current_stock -= deduct_qty
            result["materials"].append({
                "material_id": material.id,
                "name": material.name,
                "quantity": deduct_qty,
                "cost": deduct_qty * material.average_cost
            })

    prod_equip_specs = db.query(ProductEquipmentSpecification).filter(
        ProductEquipmentSpecification.product_id == product_id
    ).all()
    for pes in prod_equip_specs:
        equip_specs = db.query(EquipmentSpecification).filter(
            EquipmentSpecification.equipment_id == pes.equipment_id
        ).all()
        for es in equip_specs:
            if es.consumption_per_unit > 0:
                deduct = es.consumption_per_unit * quantity
                if es.current_resource < deduct:
                    mat = db.query(Material).filter(Material.id == es.material_id).first()
                    mat_name = mat.name if mat else f"ID:{es.material_id}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"Недостаточно ресурса '{mat_name}' для оборудования. Требуется: {deduct}, Доступно: {es.current_resource}"
                    )
                es.current_resource -= deduct
                mat = db.query(Material).filter(Material.id == es.material_id).first()
                if mat:
                    if mat.current_stock < deduct:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Недостаточно материала '{mat.name}' на складе. Требуется: {deduct}, Доступно: {mat.current_stock}"
                        )
                    mat.current_stock -= deduct

        depreciation = pes.depreciation_per_unit * quantity
        result["equipment_depreciation"] += depreciation

    return result


def _restore_materials_for_order_item(db: Session, product_id: int, quantity: int) -> None:
    specs = db.query(ProductSpecification).filter(ProductSpecification.product_id == product_id).all()
    for spec in specs:
        material = db.query(Material).filter(Material.id == spec.material_id).first()
        if material:
            restore_qty = spec.quantity * quantity
            material.current_stock += restore_qty

    prod_equip_specs = db.query(ProductEquipmentSpecification).filter(
        ProductEquipmentSpecification.product_id == product_id
    ).all()
    for pes in prod_equip_specs:
        equip_specs = db.query(EquipmentSpecification).filter(
            EquipmentSpecification.equipment_id == pes.equipment_id
        ).all()
        for es in equip_specs:
            if es.consumption_per_unit > 0:
                restore = es.consumption_per_unit * quantity
                es.current_resource += restore
                mat = db.query(Material).filter(Material.id == es.material_id).first()
                if mat:
                    mat.current_stock += restore


@router.post("/orders/{order_id}/items/", response_model=OrderItemSchema)
def create_order_item(order_id: int, item: OrderItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    item_data = item.model_dump()
    item_data['order_id'] = order_id
    db_item = OrderItem(**item_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    _deduct_materials_for_order_item(db, item.product_id, item.quantity)
    db.commit()

    total = db.query(func.sum(OrderItem.total_price)).filter(OrderItem.order_id == order_id).scalar() or 0
    order.total_amount = total
    db.commit()

    return db_item


@router.delete("/orders/{order_id}/items/{item_id}/")
def delete_order_item(order_id: int, item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(OrderItem).filter(OrderItem.id == item_id, OrderItem.order_id == order_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Позиция не найдена")

    _restore_materials_for_order_item(db, item.product_id, item.quantity)

    db.delete(item)
    db.commit()

    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        total = db.query(func.sum(OrderItem.total_price)).filter(OrderItem.order_id == order_id).scalar() or 0
        order.total_amount = total
        db.commit()

    return {"message": "Позиция удалена"}


@router.get("/analytics/sales-summary/")
def get_sales_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    total_delivery_cost = db.query(func.sum(Order.delivery_cost)).filter(Order.delivery_paid_by_customer == False).scalar() or 0
    order_count = db.query(func.count(Order.id)).scalar() or 0
    paid_orders = db.query(func.count(Order.id)).filter(Order.is_paid == True).scalar() or 0

    return {
        "total_revenue": total_revenue,
        "total_delivery_cost": total_delivery_cost,
        "order_count": order_count,
        "paid_orders": paid_orders
    }


@router.get("/analytics/top-products/")
def get_top_products(limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = db.query(
        Product.id,
        Product.name.label("product_name"),
        func.sum(OrderItem.quantity).label("total_quantity"),
        func.sum(OrderItem.total_price).label("total_revenue")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .group_by(Product.id, Product.name)\
     .order_by(func.sum(OrderItem.total_price).desc())\
     .limit(limit).all()

    return [{"product_id": r.id, "product_name": r.product_name, "total_quantity": r.total_quantity, "total_revenue": r.total_revenue} for r in results]


@router.get("/analytics/top-customers/")
def get_top_customers(limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = db.query(
        Customer.id,
        Customer.name.label("customer_name"),
        func.count(Order.id).label("order_count"),
        func.sum(Order.total_amount).label("total_revenue")
    ).join(Order, Customer.id == Order.customer_id)\
     .group_by(Customer.id, Customer.name)\
     .order_by(func.sum(Order.total_amount).desc())\
     .limit(limit).all()

    return [{"customer_id": r.id, "customer_name": r.customer_name, "order_count": r.order_count, "total_revenue": r.total_revenue} for r in results]
