from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
import datetime

# --- UnitType ---
class UnitTypeBase(BaseModel):
    name: str

class UnitTypeCreate(UnitTypeBase):
    pass

class UnitType(UnitTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Material ---
class MaterialBase(BaseModel):
    name: str
    unit_id: int
    current_stock: float = 0
    min_stock: Optional[float] = None
    average_cost: float = 0
    material_type: str = "common"  # common или equipment_supply

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- MaterialBatch ---
class MaterialBatchBase(BaseModel):
    material_id: int
    quantity: float
    total_cost: float
    purchase_date: datetime.date

class MaterialBatchCreate(MaterialBatchBase):
    pass

class MaterialBatch(MaterialBatchBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- CustomerType ---
class CustomerTypeBase(BaseModel):
    name: str

class CustomerTypeCreate(CustomerTypeBase):
    pass

class CustomerType(CustomerTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Customer ---
class CustomerBase(BaseModel):
    name: str
    type_id: int
    contact_info: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Equipment ---
class EquipmentBase(BaseModel):
    name: str
    cost: float

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- EquipmentSpecification ---
class EquipmentSpecificationBase(BaseModel):
    equipment_id: int
    material_id: int
    resource_type: str
    total_resource: float
    current_resource: float
    min_resource: float = 0
    consumption_per_unit: float = 0

class EquipmentSpecificationCreate(EquipmentSpecificationBase):
    pass

class EquipmentSpecification(EquipmentSpecificationBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Product ---
class ProductBase(BaseModel):
    name: str
    sale_price: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ProductSpecification ---
class ProductSpecificationBase(BaseModel):
    product_id: int
    material_id: int
    quantity: float

class ProductSpecificationCreate(ProductSpecificationBase):
    pass

class ProductSpecification(ProductSpecificationBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ProductEquipmentSpecification ---
class ProductEquipmentSpecificationBase(BaseModel):
    product_id: int
    equipment_id: int
    depreciation_per_unit: float

class ProductEquipmentSpecificationCreate(ProductEquipmentSpecificationBase):
    pass

class ProductEquipmentSpecification(ProductEquipmentSpecificationBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ProductionAct ---
class ProductionActBase(BaseModel):
    product_id: int
    quantity: int
    production_date: datetime.date
    unit_cost: float
    total_cost: float

class ProductionActCreate(ProductionActBase):
    pass

class ProductionAct(ProductionActBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ProductionMaterialConsumption ---
class ProductionMaterialConsumptionBase(BaseModel):
    production_act_id: int
    material_id: int
    quantity: float
    cost_at_consumption: float

class ProductionMaterialConsumptionCreate(ProductionMaterialConsumptionBase):
    pass

class ProductionMaterialConsumption(ProductionMaterialConsumptionBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Defect ---
class DefectBase(BaseModel):
    material_id: int
    quantity: float
    reason: Optional[str] = None
    defect_date: datetime.date

class DefectCreate(DefectBase):
    pass

class Defect(DefectBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ReturnableMaterial ---
class ReturnableMaterialBase(BaseModel):
    material_id: int
    quantity: float
    estimated_cost: float = 0
    receipt_date: datetime.date
    description: Optional[str] = None

class ReturnableMaterialCreate(ReturnableMaterialBase):
    pass

class ReturnableMaterial(ReturnableMaterialBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- ShippingMethod ---
class ShippingMethodBase(BaseModel):
    name: str
    is_active: bool = True

class ShippingMethodCreate(ShippingMethodBase):
    pass

class ShippingMethod(ShippingMethodBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Order ---
class OrderBase(BaseModel):
    customer_id: int
    order_date: datetime.date
    total_amount: float
    delivery_cost: float = 0
    delivery_paid_by_customer: bool = False
    is_paid: bool = False
    is_shipped: bool = False
    shipped_at: Optional[datetime.date] = None
    shipping_method_id: Optional[int] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    order_date: Optional[datetime.date] = None
    delivery_cost: Optional[float] = None
    delivery_paid_by_customer: Optional[bool] = None
    is_paid: Optional[bool] = None
    is_shipped: Optional[bool] = None
    shipped_at: Optional[datetime.date] = None
    shipping_method_id: Optional[int] = None

class Order(OrderBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- OrderItem ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price_per_unit: float
    total_price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- DeliveryExpense ---
class DeliveryExpenseBase(BaseModel):
    order_id: int
    amount: float
    description: Optional[str] = None
    expense_date: datetime.date

class DeliveryExpenseCreate(DeliveryExpenseBase):
    pass

class DeliveryExpense(DeliveryExpenseBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- TaxRate ---
class TaxRateBase(BaseModel):
    customer_type_id: int
    rate: float
    description: Optional[str] = None

class TaxRateCreate(TaxRateBase):
    pass

class TaxRate(TaxRateBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- User ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)