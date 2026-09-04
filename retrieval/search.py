from typing import Any

from ingestion.embedding import get_embedding, get_vector_collection
from retrieval.reranker import rerank_results


CANDIDATE_K = 8


def search_documents(
    query: str,
    document_ids: list[str] | None = None,
    top_k: int = 3,
    per_document: bool = False,
) -> list[dict[str, Any]]:
    """
    Search ChromaDB and rerank the retrieved chunks.

    By default, retrieval works across all supplied documents.

    When per_document=True and document_ids are supplied, retrieval is
    performed independently for each document. This is useful for
    comparisons because each selected document gets its own relevant
    evidence.

    Args:
        query: User's natural-language question.
        document_ids: Optional list of document IDs to restrict retrieval.
        top_k: Maximum number of final chunks to return.
        per_document: Retrieve and rerank independently for each document.

    Returns:
        Reranked list of relevant chunks.
    """
    if not query.strip():
        return []

    if top_k <= 0:
        raise ValueError("top_k must be greater than 0.")

    collection = get_vector_collection()

    if collection.count() == 0:
        return []

    comparison_query = (
        f"{query}. "
        "Relevant comparison information may include dates, amounts, "
        "parties, terms, requirements, rights, obligations, responsibilities, "
        "conditions, exceptions, limitations, procedures, duration, "
        "and other substantive provisions."
    )

    def retrieve_and_rerank(
        scoped_document_ids: list[str] | None,
        search_query: str,
    ) -> list[dict[str, Any]]:
        candidate_k = max(CANDIDATE_K, top_k)

        query_embedding = get_embedding(search_query)

        query_kwargs: dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": candidate_k,
            "include": ["documents", "metadatas", "distances"],
        }

        if scoped_document_ids:
            query_kwargs["where"] = {
                "document_id": {
                    "$in": [str(doc_id) for doc_id in scoped_document_ids]
                }
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

        return rerank_results(
            query=search_query,
            results=retrieved,
        )

    if per_document and document_ids:
        comparison_results: list[dict[str, Any]] = []

        for document_id in document_ids:
            document_results = retrieve_and_rerank(
                [str(document_id)],
                comparison_query,
            )

            comparison_results.extend(document_results[:top_k])

        return comparison_results

    reranked = retrieve_and_rerank(
        document_ids,
        query,
    )

    return reranked[:top_k]