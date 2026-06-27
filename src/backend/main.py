from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import traceback

app = FastAPI(title="Система учёта производства", version="0.1.0")


from fastapi.exceptions import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Пропускаем HTTPException как есть — клиент получает правильный статус-код
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Внутренняя ошибка сервера: {str(exc)}"},
    )

# Настройка CORS (Cross-Origin Resource Sharing)
# Это необходимо, чтобы фронтенд (например, запущенный на localhost:3000)
# мог взаимодействовать с бэкендом (например, на localhost:8000)
origins = [
    "http://localhost",
    "http://localhost:3000", # Порт для React/Vite разработки
    "http://localhost:5173", # Порт по умолчанию для Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Добро пожаловать в API системы учёта производства!"}

# Подключение роутеров
from routers import materials, products, customers, equipment, sales, reports, auth, categories, units, shipping_methods
app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(equipment.router)
app.include_router(sales.router)
app.include_router(reports.router)
app.include_router(categories.router)
app.include_router(units.router)
app.include_router(shipping_methods.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)