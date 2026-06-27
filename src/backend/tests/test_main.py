import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from auth import get_password_hash
from models import User

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

TOKEN = None


@pytest.fixture(autouse=True)
def setup_test_user():
    global TOKEN
    db = TestingSessionLocal()
    existing = db.query(User).filter(User.username == "testuser").first()
    if not existing:
        user = User(username="testuser", password_hash=get_password_hash("testpassword"), email="test@example.com")
        db.add(user)
        db.commit()
    db.close()
    if TOKEN is None:
        resp = client.post("/api/auth/login", json={"username": "testuser", "password": "testpassword"})
        if resp.status_code == 200:
            TOKEN = resp.json()["access_token"]


def auth():
    return {"Authorization": f"Bearer {TOKEN}"}


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Добро пожаловать в API системы учёта производства!"}


def test_register_user():
    import uuid
    uname = f"testuser_{uuid.uuid4().hex[:8]}"
    response = client.post("/api/auth/register", json={
        "username": uname,
        "password": "testpassword",
        "email": f"{uname}@example.com"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Пользователь успешно зарегистрирован"


def test_login_user():
    response = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_wrong_password():
    response = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_get_current_user():
    response = client.get("/api/auth/me", headers=auth())
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_create_material():
    response = client.post("/api/materials/", json={
        "name": "Test Material",
        "unit_id": 1,
        "current_stock": 100,
        "min_stock": 10,
        "average_cost": 50.0
    }, headers=auth())
    assert response.status_code == 200
    assert response.json()["name"] == "Test Material"


def test_get_materials():
    response = client.get("/api/materials/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_customer():
    response = client.post("/api/customers/", json={
        "name": "Test Customer",
        "type_id": 1,
        "contact_info": "test@example.com"
    }, headers=auth())
    assert response.status_code == 200
    assert response.json()["name"] == "Test Customer"


def test_get_customers():
    response = client.get("/api/customers/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_equipment():
    response = client.post("/api/equipment/", json={
        "name": "Test Equipment",
        "cost": 10000
    }, headers=auth())
    assert response.status_code == 200
    assert response.json()["name"] == "Test Equipment"


def test_get_equipment():
    response = client.get("/api/equipment/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_product():
    response = client.post("/api/products/", json={
        "name": "Test Product",
        "sale_price": 100
    }, headers=auth())
    assert response.status_code == 200
    assert response.json()["name"] == "Test Product"


def test_get_products():
    response = client.get("/api/products/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_order():
    response = client.post("/api/sales/orders/", json={
        "customer_id": 1,
        "order_date": "2024-01-01",
        "total_amount": 500,
        "delivery_cost": 50,
        "delivery_paid_by_customer": False,
        "is_paid": False
    }, headers=auth())
    assert response.status_code == 200
    assert response.json()["total_amount"] == 500


def test_get_orders():
    response = client.get("/api/sales/orders/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_material_stocks():
    response = client.get("/api/reports/material-stocks/", headers=auth())
    assert response.status_code == 200
    assert isinstance(response.json(), list)
