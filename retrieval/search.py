from typing import Any

from ingestion.embedding import get_embedding, get_vector_collection


def search_documents(
    query: str,
    document_ids: list[str] | None = None,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    """
    Search ChromaDB for chunks relevant to the user's query.

    Args:
        query: User's natural-language question.
        document_ids: Optional list of document IDs to restrict retrieval.
        top_k: Maximum number of chunks to return.

    Returns:
        List of retrieved chunks with their metadata and similarity distance.
    """
    if not query.strip():
        return []

    if top_k <= 0:
        raise ValueError("top_k must be greater than 0.")

    collection = get_vector_collection()

    if collection.count() == 0:
        return []

    query_embedding = get_embedding(query)

    query_kwargs: dict[str, Any] = {
        "query_embeddings": [query_embedding],
        "n_results": top_k,
        "include": ["documents", "metadatas", "distances"],
    }

    if document_ids:
        query_kwargs["where"] = {
            "document_id": {"$in": [str(doc_id) for doc_id in document_ids]}
        }

    results = collection.query(**query_kwargs)

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    retrieved: list[dict[str, Any]] = []

    for document, metadata, distance in zip(
        documents,
        metadatas,
        distances,
    ):
        retrieved.append(
            {
                "chunk_text": document,
                "document_id": metadata.get("document_id"),
                "source": metadata.get("source"),
                "page_number": metadata.get("page_number"),
                "distance": distance,
            }
        )

    return retrieved