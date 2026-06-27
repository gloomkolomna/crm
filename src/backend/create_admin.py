"""Скрипт для создания администратора по умолчанию"""
from database import engine, SessionLocal, Base
from models import User
from auth import get_password_hash

# Создаём таблицы
Base.metadata.create_all(bind=engine)

# Создаём сессию
db = SessionLocal()

# Удаляем старого пользователя если существует
existing_user = db.query(User).filter(User.username == "admin").first()
if existing_user:
    db.delete(existing_user)
    db.commit()
    print("Старый пользователь admin удалён")

# Создаём администратора
admin_user = User(
    username="admin",
    password_hash=get_password_hash("111"),
    email="admin@uchet.local"
)
db.add(admin_user)
db.commit()
db.refresh(admin_user)
print(f"Создан пользователь: {admin_user.username}")

db.close()
print("Готово!")