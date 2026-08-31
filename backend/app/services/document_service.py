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


def get_documents(db: Session) -> list[Document]:
    return (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .all()
    )


def get_document(
    db: Session,
    document_id: str,
) -> Document | None:
    return (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )


def delete_document(
    db: Session,
    document: Document,
) -> None:
    storage_path = Path(document.storage_path) if document.storage_path else None

    db.delete(document)
    db.commit()

    if storage_path and storage_path.exists():
        storage_path.unlink()