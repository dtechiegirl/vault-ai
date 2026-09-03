from evaluation.retrieval_eval import evaluate_recall_at_k


def test_recall_at_3():
    result = evaluate_recall_at_k(top_k=3)

    print(f"\nRecall@3: {result['hits']}/{result['total']}")
    print(f"Recall@3 percentage: {result['recall_percentage']:.2f}%")

    for item in result["results"]:
        status = "✓" if item["retrieved"] else "✗"
        print(f"{status} {item['id']}: {item['question']}")

    assert result["total"] == 15
    assert 0.0 <= result["recall"] <= 1.0