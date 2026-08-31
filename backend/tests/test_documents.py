from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.db.database import Base, get_db
from backend.app.main import app
from backend.app.api.routes.documents import UPLOAD_DIR

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def mock_ingest_document(document):
    document.status = "indexed"
    return 1


def test_upload_pdf():
    with patch(
        "backend.app.api.routes.documents.ingest_document",
        side_effect=mock_ingest_document,
    ):
        response = client.post(
            "/documents/upload",
            files={
                "file": (
                    "test.pdf",
                    b"fake pdf content",
                    "application/pdf",
                )
            },
        )

    assert response.status_code == 201

    data = response.json()

    assert data["filename"] == "test.pdf"
    assert data["file_type"] == "pdf"
    assert data["status"] == "indexed"
    assert data["storage_path"].endswith(".pdf")
    assert "id" in data
    assert Path(data["storage_path"]).exists()


def test_upload_txt():
    with patch(
        "backend.app.api.routes.documents.ingest_document",
        side_effect=mock_ingest_document,
    ):
        response = client.post(
            "/documents/upload",
            files={
                "file": (
                    "notes.txt",
                    b"Hello Vault AI",
                    "text/plain",
                )
            },
        )

    assert response.status_code == 201

    data = response.json()

    assert data["filename"] == "notes.txt"
    assert data["file_type"] == "txt"
    assert data["status"] == "indexed"


def test_upload_unsupported_file_type():
    response = client.post(
        "/documents/upload",
        files={
            "file": (
                "image.jpg",
                b"fake image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_uploaded_file_uses_document_id_for_storage():
    with patch(
        "backend.app.api.routes.documents.ingest_document",
        side_effect=mock_ingest_document,
    ):
        response = client.post(
            "/documents/upload",
            files={
                "file": (
                    "my-report.pdf",
                    b"fake pdf content",
                    "application/pdf",
                )
            },
        )

    assert response.status_code == 201

    data = response.json()

    document_id = data["id"]
    expected_path = UPLOAD_DIR / f"{document_id}.pdf"

    assert expected_path.exists()

    expected_path.unlink()