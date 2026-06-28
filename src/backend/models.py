from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class UnitType(Base):
    __tablename__ = "unit_types"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("Category", remote_side=[id], backref="children")


class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    unit_id = Column(Integer, ForeignKey("unit_types.id"), nullable=False, index=True)
    url = Column(String(500), nullable=True)
    article = Column(String(100), nullable=True)
    current_stock = Column(Float, nullable=False, default=0)
    min_stock = Column(Float, default=None)
    average_cost = Column(Float, default=0)
    material_type = Column(String(20), default="common", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    unit = relationship("UnitType")
    category = relationship("Category")

class MaterialBatch(Base):
    __tablename__ = "material_batches"
    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    purchase_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("Material")

class CustomerType(Base):
    __tablename__ = "customer_types"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type_id = Column(Integer, ForeignKey("customer_types.id"), nullable=False, index=True)
    contact_info = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer_type = relationship("CustomerType")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    specifications = relationship("EquipmentSpecification", back_populates="equipment", cascade="all, delete-orphan")


class EquipmentSpecification(Base):
    __tablename__ = "equipment_specifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    total_resource = Column(Float, nullable=False)
    current_resource = Column(Float, nullable=False)
    min_resource = Column(Float, default=0)
    consumption_per_unit = Column(Float, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    equipment = relationship("Equipment", back_populates="specifications")
    material = relationship("Material")


class EquipmentConsumption(Base):
    __tablename__ = "equipment_consumption"
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity_consumed = Column(Float, nullable=False)
    consumption_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    equipment = relationship("Equipment")
    material = relationship("Material")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    sale_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ProductSpecification(Base):
    __tablename__ = "product_specifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product")
    material = relationship("Material")

class ProductEquipmentSpecification(Base):
    __tablename__ = "product_equipment_specifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False, index=True)
    depreciation_per_unit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product")
    equipment = relationship("Equipment")

class ProductionAct(Base):
    __tablename__ = "production_acts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    production_date = Column(Date, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product")

class ProductionMaterialConsumption(Base):
    __tablename__ = "production_material_consumption"
    id = Column(Integer, primary_key=True, autoincrement=True)
    production_act_id = Column(Integer, ForeignKey("production_acts.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    cost_at_consumption = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    production_act = relationship("ProductionAct")
    material = relationship("Material")

class Defect(Base):
    __tablename__ = "defects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    reason = Column(Text)
    defect_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("Material")

class ReturnableMaterial(Base):
    __tablename__ = "returnable_materials"
    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    estimated_cost = Column(Float, default=0)
    receipt_date = Column(Date, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("Material")

class ShippingMethod(Base):
    __tablename__ = "shipping_methods"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    order_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    delivery_cost = Column(Float, default=0)
    delivery_paid_by_customer = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    is_shipped = Column(Boolean, default=False)
    shipped_at = Column(Date, nullable=True)
    shipping_method_id = Column(Integer, ForeignKey("shipping_methods.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer")
    shipping_method = relationship("ShippingMethod")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order")
    product = relationship("Product")

class DeliveryExpense(Base):
    __tablename__ = "delivery_expenses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    expense_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order")

class TaxRate(Base):
    __tablename__ = "tax_rates"
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_type_id = Column(Integer, ForeignKey("customer_types.id"), nullable=False, index=True)
    rate = Column(Float, nullable=False)
    description = Column(String(255))

    customer_type = relationship("CustomerType")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    vk_id = Column(String(20), unique=True, nullable=False)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))