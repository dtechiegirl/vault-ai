from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.document import DocumentResponse
from backend.app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    get_documents,
    get_document_storage_path,
)
from backend.app.services.ingestion_service import ingest_document

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
        # Save uploaded file
        content = await file.read()
        file_path.write_bytes(content)

        document.storage_path = str(file_path)

        # Ingest document into chunks/vector store
        ingest_document(document)

        # Save final document state
        db.commit()
        db.refresh(document)

        return document

    except Exception as e:
        db.rollback()

        document = get_document(db, document.id)

        if document:
            document.status = "error"
            db.commit()

        print(f"[INGESTION ERROR] {type(e).__name__}: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {e}",
        )
        


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def list_documents(
    db: Session = Depends(get_db),
) -> list[DocumentResponse]:
    return get_documents(db)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_document(
    document_id: str,
    db: Session = Depends(get_db),
) -> None:
    document = get_document(db, document_id)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    delete_document(db, document)