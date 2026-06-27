"""Скрипт для создания всех таблиц в базе данных"""
from database import engine, Base
from models import (
    UnitType, Category, Material, MaterialBatch,
    CustomerType, Customer, Equipment, EquipmentSpecification, EquipmentConsumption,
    Product, ProductSpecification, ProductEquipmentSpecification,
    ProductionAct, ProductionMaterialConsumption,
    Defect, ReturnableMaterial,
    Order, OrderItem, DeliveryExpense, TaxRate,
    User
)

def init_db():
    # Создаём все таблицы
    Base.metadata.create_all(bind=engine)
    print("OK: Vse tablitsy sozdany!")

if __name__ == "__main__":
    init_db()
