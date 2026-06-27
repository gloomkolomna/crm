"""Скрипт для добавления начальных единиц измерения"""
from database import SessionLocal, Base, engine
from models import UnitType

# Создаём таблицы если не существуют
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Проверяем, есть ли уже единицы 测量ения
existing = db.query(UnitType).first()
if existing:
    print("Единицы измерения уже существуют")
else:
    # Добавляем стандартные единицы измерения
    units = [
        UnitType(name="Штуки"),
        UnitType(name="Килограммы"),
        UnitType(name="Граммы"),
        UnitType(name="Метры"),
        UnitType(name="Сантиметры"),
        UnitType(name="Литры"),
        UnitType(name="Миллилитры"),
        UnitType(name="Листы"),
        UnitType(name="Упаковки"),
        UnitType(name="Проценты"),
    ]
    for unit in units:
        db.add(unit)
    db.commit()
    print(f"Добавлено {len(units)} единиц измерения")

db.close()
print("Готово!")