from typing import Any

from evaluation.dataset import load_dataset
from retrieval.search import search_documents


TOP_K = 3


def evaluate_recall_at_k(top_k: int = TOP_K) -> dict[str, Any]:
    """
    Evaluate whether the expected source document and page
    appear within the top-k retrieved chunks.
    """

    dataset = load_dataset()
    questions = dataset["golden_qa"]

    results = []

    for item in questions:
        retrieved_chunks = search_documents(
            query=item["question"],
            top_k=top_k,
        )

        expected_source = item["source_document"]
        expected_page = item["page_number"]

        retrieved = any(
            chunk["source"] == expected_source
            and chunk["page_number"] == expected_page
            for chunk in retrieved_chunks
        )

        results.append(
            {
                "id": item["id"],
                "question": item["question"],
                "expected_source": expected_source,
                "expected_page": expected_page,
                "retrieved": retrieved,
                "retrieved_chunks": retrieved_chunks,
            }
        )
        
        if not retrieved:
            print(f"\n❌ {item['id']}: {item['question']}")
            print(
                f"Expected: {expected_source}, "
                f"Page {expected_page}"
            )

            for rank, chunk in enumerate(retrieved_chunks, start=1):
                print(
                    f"  {rank}. "
                    f"Source: {chunk['source']} | "
                    f"Page: {chunk['page_number']} | "
                    f"Distance: {chunk['distance']:.4f}"
                )
                print(f"     {chunk['chunk_text'][:300]}...")

    hits = sum(result["retrieved"] for result in results)
    total = len(results)

    recall = hits / total if total else 0.0

    return {
        "metric": f"Recall@{top_k}",
        "hits": hits,
        "total": total,
        "recall": recall,
        "recall_percentage": recall * 100,
        "results": results,
    }