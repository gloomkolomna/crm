from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Category, User
from auth import get_current_user

router = APIRouter(
    prefix="/api/categories",
    tags=["Категории"],
)


# ==================== CATEGORIES ====================

@router.get("/")
def get_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories


@router.get("/{category_id}")
def get_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return category


@router.post("/")
def create_category(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = Category(
        name=data.get("name"),
        parent_id=data.get("parent_id")
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}")
def update_category(category_id: int, data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    category.name = data.get("name", category.name)
    category.parent_id = data.get("parent_id", category.parent_id)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    db.delete(category)
    db.commit()
    return {"message": "Категория удалена"}