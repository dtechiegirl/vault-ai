from pathlib import Path

from sqlalchemy.orm import Session

from backend.app.db.models import Document


def create_document(
    db: Session,
    filename: str,
    file_type: str,
) -> Document:
    document = Document(
        filename=filename,
        file_type=file_type,
        storage_path="",
        status="uploaded",
    )

    db.add(document)
    db.flush()

    return document


def get_document_storage_path(
    document: Document,
    upload_dir: Path,
) -> Path:
    return upload_dir / f"{document.id}.{document.file_type}"