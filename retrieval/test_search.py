from retrieval.search import search_documents

results = search_documents(
    "What is this agreement about?",
    top_k=3,
)

print("Results:", len(results))

for i, result in enumerate(results, start=1):
    print(f"\nResult {i}")
    print("Source:", result["source"])
    print("Page:", result["page_number"])
    print("Distance:", result["distance"])
    print("Text:", result["chunk_text"])