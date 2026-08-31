"""
Embedding generation and ChromaDB vector store management for Vault AI.

Converts text chunks into numerical vectors using Ollama and persists
them locally in ChromaDB for semantic retrieval.

Expected chunk structure:
{
    "chunk_text": "...",
    "page_number": 1,
    "source": "document.pdf",
    "document_id": "document-uuid"
}
"""

import os
import uuid
from typing import Any, Dict, List

import chromadb
import ollama


EMBEDDING_MODEL = "nomic-embed-text"
COLLECTION_NAME = "vault_ai_store"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_STORE_DIR = os.path.join(PROJECT_ROOT, "chroma_db")


def ensure_embedding_model_installed(
    model_name: str = EMBEDDING_MODEL,
) -> None:
    """
    Check whether the required embedding model is available in Ollama.

    If the model is missing, pull it locally.
    """
    models_info = ollama.list()
    installed_models = [model.model for model in models_info.models]

    if not any(model_name in name for name in installed_models):
        print(
            f"[OLLAMA] Model '{model_name}' not found locally. "
            "Downloading..."
        )
        ollama.pull(model_name)
        print(f"[OLLAMA] Model '{model_name}' installed successfully.")


def get_embedding(text: str) -> List[float]:
    """
    Generate an embedding for a piece of text using Ollama.
    """
    if not text.strip():
        raise ValueError("Cannot generate an embedding for empty text.")

    response = ollama.embeddings(
        model=EMBEDDING_MODEL,
        prompt=text,
    )

    return response["embedding"]


def get_vector_collection():
    """
    Return the persistent ChromaDB collection used by Vault AI.
    """
    client = chromadb.PersistentClient(path=VECTOR_STORE_DIR)

    return client.get_or_create_collection(
        name=COLLECTION_NAME,
    )


def create_vector_store(chunks: List[Dict[str, Any]]) -> int:
    """
    Generate embeddings for document chunks and persist them in ChromaDB.

    Each stored chunk contains metadata linking it back to the original
    document and its page/slide for later retrieval and citation.

    Returns:
        Number of chunks stored.
    """
    if not chunks:
        print("[EMBEDDING] No chunks provided. Skipping.")
        return 0

    collection = get_vector_collection()

    documents: List[str] = []
    embeddings: List[List[float]] = []
    metadatas: List[Dict[str, Any]] = []
    ids: List[str] = []

    for idx, chunk in enumerate(chunks):
        required_fields = {
            "chunk_text",
            "page_number",
            "source",
            "document_id",
        }

        missing_fields = required_fields - chunk.keys()

        if missing_fields:
            raise ValueError(
                f"Chunk {idx} is missing required fields: "
                f"{sorted(missing_fields)}"
            )

        chunk_text = str(chunk["chunk_text"]).strip()

        if not chunk_text:
            continue

        print(
            f"[EMBEDDING] Embedding chunk "
            f"{idx + 1}/{len(chunks)} from "
            f"'{chunk['source']}'..."
        )

        embedding_vector = get_embedding(chunk_text)

        documents.append(chunk_text)
        embeddings.append(embedding_vector)

        metadatas.append(
            {
                "document_id": str(chunk["document_id"]),
                "source": str(chunk["source"]),
                "page_number": int(chunk["page_number"]),
            }
        )

        ids.append(str(uuid.uuid4()))

    if not documents:
        print("[EMBEDDING] No valid chunks to store.")
        return 0

    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    stored_count = len(documents)

    print(
        f"[EMBEDDING] Embedding complete. "
        f"{stored_count} chunks persisted in ChromaDB."
    )
    print(
        f"[EMBEDDING] Total records in collection: "
        f"{collection.count()}"
    )

    return stored_count