from pathlib import Path

from backend.app.db.models import Document
from ingestion.chunker import chunk_document_pages
from ingestion.embedding import create_vector_store
from ingestion.parser import parse_document


def ingest_document(document: Document) -> int:
    """
    Parse, chunk, embed, and store a document.

    Updates the document status throughout the ingestion process.

    Returns:
        int: Number of chunks stored in the vector database.
    """
    file_path = Path(document.storage_path)

    try:
        # 1. Parse the document into pages/slides.
        document.status = "processing"

        pages = parse_document(
            str(file_path),
            source_name=document.filename
        )

        if not pages:
            document.status = "empty"
            return 0

        # 2. Split parsed content into token-based chunks.
        chunks = chunk_document_pages(pages)

        if not chunks:
            document.status = "empty"
            return 0

        # 3. Attach the database document ID to every chunk.
        for chunk in chunks:
            chunk["document_id"] = document.id

        # 4. Generate embeddings and store them in ChromaDB.
        stored_count = create_vector_store(chunks)

        if stored_count == 0:
            document.status = "empty"
            return 0

        # 5. Mark the document as successfully indexed.
        document.status = "indexed"

        return stored_count

    except Exception:
        document.status = "error"
        raise