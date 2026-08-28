from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from backend.app.db.database import Base
from backend.app.db.models import Document


def test_document_table_exists():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    assert "documents" in inspector.get_table_names()


def test_document_can_be_created():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    session = TestingSessionLocal()

    document = Document(
        filename="test.pdf",
        file_type="pdf",
    )

    session.add(document)
    session.commit()
    session.refresh(document)

    assert document.id is not None
    assert document.filename == "test.pdf"
    assert document.file_type == "pdf"
    assert document.status == "uploaded"
    assert document.created_at is not None

    session.close()