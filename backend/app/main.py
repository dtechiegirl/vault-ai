from fastapi import FastAPI

from backend.app.api.routes.documents import router as documents_router
from backend.app.db.database import init_db


app = FastAPI(
    title="Vault AI",
    description="Privacy-first document intelligence platform",
    version="0.1.0",
)


init_db()

app.include_router(documents_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}