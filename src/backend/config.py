import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./uchet.db")
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))

VK_CLIENT_ID = os.getenv("VK_CLIENT_ID", "")
VK_CLIENT_SECRET = os.getenv("VK_CLIENT_SECRET", "")
VK_REDIRECT_URI = os.getenv("VK_REDIRECT_URI", "https://belovolovhome.ru/crm/api/auth/vk-callback")
VK_SERVICE_TOKEN = os.getenv("VK_SERVICE_TOKEN", "")
VK_API_VERSION = "5.131"

def get_allowed_vk_ids() -> set[int]:
    raw = os.getenv("VK_ALLOWED_IDS", "")
    if not raw:
        return set()
    return {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}
