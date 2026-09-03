from pathlib import Path

from backend.app.db.database import SessionLocal
from backend.app.services.document_service import (
    create_document,
    get_document_storage_path,
)
from backend.app.services.ingestion_service import ingest_document


EVALUATION_DIR = Path(__file__).parent / "sample_documents"
UPLOAD_DIR = Path("data/uploads")


def ingest_evaluation_documents() -> None:
    documents = [
        "sample_operation_agreement.txt",
        "EMPLOYAG_Sample.pdf",
    ]

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()

    try:
        for filename in documents:
            source_path = EVALUATION_DIR / filename

            if not source_path.exists():
                raise FileNotFoundError(
                    f"Evaluation document not found: {source_path}"
                )

            file_type = source_path.suffix.lstrip(".").lower()

            print(f"\n[INGESTION] Processing: {filename}")

            # Create the database document record.
            document = create_document(
                db=db,
                filename=filename,
                file_type=file_type,
            )

            # Use the same storage-path convention as the API.
            storage_path = get_document_storage_path(
                document=document,
                upload_dir=UPLOAD_DIR,
            )

            # Copy the evaluation document into application storage.
            storage_path.write_bytes(source_path.read_bytes())

            document.storage_path = str(storage_path)

            # Run the real application ingestion pipeline.
            chunk_count = ingest_document(document)

            db.commit()

            print(
                f"[INGESTION] {filename}: "
                f"{chunk_count} chunks stored"
            )
            print(
                f"[INGESTION] Document ID: {document.id}"
            )
            print(
                f"[INGESTION] Status: {document.status}"
            )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    ingest_evaluation_documents()