from fastapi import FastAPI

from backend.app.api.routes.documents import router as documents_router
from backend.app.db.database import init_db
from backend.app.api.routes.chat import router as chat_router
from backend.app.api.routes.studio import router as studio_router


app = FastAPI(
    title="Vault AI",
    description="Privacy-first document intelligence platform",
    version="0.1.0",
)


init_db()

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(studio_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}