from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.document import DocumentResponse
from backend.app.services.document_service import (
    create_document,
    get_document_storage_path,
)

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".txt"}
UPLOAD_DIR = Path("data/uploads")


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Supported formats: PDF, PPTX, TXT.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    document = create_document(
        db=db,
        filename=file.filename,
        file_type=extension.lstrip("."),
    )

    file_path = get_document_storage_path(
        document=document,
        upload_dir=UPLOAD_DIR,
    )

    try:
        content = await file.read()
        file_path.write_bytes(content)

        document.storage_path = str(file_path)

        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store document.",
        )

    return document