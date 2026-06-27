import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from alembic.config import Config
from alembic import command
from database import engine, SessionLocal, Base
from models import UnitType, CustomerType, TaxRate, User
from auth import get_password_hash


def run_migrations():
    """Применить все миграции Alembic"""
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("OK: Migracii primeneny!")


def seed_data():
    """Заполнить начальными данными"""
    # Создаём таблицы напрямую если миграции не сработали
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if not db.query(UnitType).first():
            units = [
                UnitType(name="Штуки"), UnitType(name="Килограммы"),
                UnitType(name="Граммы"), UnitType(name="Метры"),
                UnitType(name="Сантиметры"), UnitType(name="Литры"),
                UnitType(name="Миллилитры"), UnitType(name="Листы"),
                UnitType(name="Упаковки"), UnitType(name="Проценты"),
            ]
            for u in units:
                db.add(u)
            db.commit()
            print(f"DOBAVLENO {len(units)} edinits izmereniya")

        if not db.query(CustomerType).first():
            db.add(CustomerType(name="Физическое лицо"))
            db.add(CustomerType(name="Юридическое лицо / ИП"))
            db.commit()
            print("DOBAVLENO 2 tipa klientov")

        if not db.query(TaxRate).first():
            db.add(TaxRate(customer_type_id=1, rate=0.04, description="Налог для физических лиц"))
            db.add(TaxRate(customer_type_id=2, rate=0.06, description="Налог для юридических лиц"))
            db.commit()
            print("DOBAVLENO 2 nalogovye stavki")

        if not db.query(User).filter(User.username == "admin").first():
            admin = User(username="admin", password_hash=get_password_hash("111"), email="admin@uchet.local")
            db.add(admin)
            db.commit()
            print("SOZDAN admin (login: admin, parol: 111)")
    finally:
        db.close()


if __name__ == "__main__":
    run_migrations()
    if "--seed" in sys.argv:
        seed_data()
    print("Gotovo!")