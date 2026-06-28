import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from alembic.config import Config
from alembic import command
from database import engine, SessionLocal, Base
from models import UnitType, CustomerType, TaxRate

ALEMBIC_CFG = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
DB_PATH = os.path.join(os.path.dirname(__file__), "uchet.db")
VERSIONS_DIR = os.path.join(os.path.dirname(__file__), "alembic", "versions")


def cmd_migrate():
    command.upgrade(ALEMBIC_CFG, "head")
    print("Миграции применены")


def cmd_seed():
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
            print(f"Добавлено {len(units)} единиц измерения")

        if not db.query(CustomerType).first():
            db.add(CustomerType(name="Физическое лицо"))
            db.add(CustomerType(name="Юридическое лицо / ИП"))
            db.commit()
            print("Добавлено 2 типа клиентов")

        if not db.query(TaxRate).first():
            db.add(TaxRate(customer_type_id=1, rate=0.04, description="Налог для физических лиц"))
            db.add(TaxRate(customer_type_id=2, rate=0.06, description="Налог для юридических лиц"))
            db.commit()
            print("Добавлено 2 налоговые ставки")

        print("Пользователи создаются автоматически при первом входе через VK")
    finally:
        db.close()


def cmd_reset():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Удалена uchet.db")

    for f in os.listdir(VERSIONS_DIR):
        if f.endswith(".py"):
            fp = os.path.join(VERSIONS_DIR, f)
            os.remove(fp)
    print("Удалены старые миграции")

    command.revision(ALEMBIC_CFG, autogenerate=True, message="initial")
    print("Создана начальная миграция")

    cmd_migrate()
    cmd_seed()
    print("База данных пересоздана")


def cmd_upgrade(message: str = None):
    if not message:
        message = "update"
    command.revision(ALEMBIC_CFG, autogenerate=True, message=message)
    print(f"Создана миграция: {message}")
    cmd_migrate()


def print_usage():
    print("Использование: python db.py <команда>")
    print()
    print("Команды:")
    print("  reset                Полный сброс БД (удалить, создать, применить, засеять)")
    print("  migrate              Применить миграции")
    print("  seed                 Заполнить начальными данными")
    print("  upgrade [описание]   Создать авто-миграцию и применить")
    print()
    print("Примеры:")
    print("  python db.py reset")
    print("  python db.py upgrade \"добавлено поле цены\"")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    cmds = {"migrate": cmd_migrate, "seed": cmd_seed, "reset": cmd_reset}
    cmd = sys.argv[1]

    if cmd == "upgrade":
        msg = sys.argv[2] if len(sys.argv) > 2 else None
        cmd_upgrade(msg)
    elif cmd in cmds:
        cmds[cmd]()
    else:
        print(f"Неизвестная команда: {cmd}")
        print_usage()
        sys.exit(1)
