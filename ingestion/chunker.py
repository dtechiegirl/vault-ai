"""
ingestion/chunker.py
Semantic chunking engine for Vault AI.
Splits parsed document pages into smaller, overlapping text chunks
while preserving source and page metadata for citations.
"""

from typing import List, Dict, Any

def chunk_document_pages(
    pages_data: List[Dict[str, Any]], 
    chunk_size: int = 500, 
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:
    """
    Splits document page records into smaller text chunks with sliding-window overlap.
    
    Args:
        pages_data (List[Dict[str, Any]]): List of parsed pages containing 'text', 'page_number', and 'source'.
        chunk_size (int, optional): Maximum length of each text chunk. Defaults to 500.
        chunk_overlap (int, optional): Number of overlapping characters between chunks. Defaults to 50.
        
    Returns:
        List[Dict[str, Any]]: A list of chunk dictionaries with preserved source and page metadata:
            [
                {
                    "chunk_text": "...",
                    "page_number": 1,
                    "source": "contract.pdf"
                }, ...
            ]
    """
    all_chunks: List[Dict[str, Any]] = []

    for page_info in pages_data:
        text = page_info["text"]
        page_num = page_info["page_number"]
        source_name = page_info["source"]

        start = 0
        text_length = len(text)

        # Handle very short pages that don't need splitting
        if text_length <= chunk_size:
            if text.strip():
                all_chunks.append({
                    "chunk_text": text.strip(),
                    "page_number": page_num,
                    "source": source_name
                })
            continue

        # Sliding window chunking
        while start < text_length:
            end = start + chunk_size
            chunk_text = text[start:end].strip()

            if chunk_text:
                all_chunks.append({
                    "chunk_text": chunk_text,
                    "page_number": page_num,
                    "source": source_name
                })

            # Move forward by (chunk_size - chunk_overlap)
            start += (chunk_size - chunk_overlap)

    return all_chunks


if __name__ == "__main__":
    # Quick self-test
    mock_pages = [
        {
            "text": "Vault AI is a privacy-first document intelligence platform. It runs completely offline using local LLMs.",
            "page_number": 1,
            "source": "sample_presentation.pptx"
        }
    ]
    test_chunks = chunk_document_pages(mock_pages, chunk_size=60, chunk_overlap=15)
    print(f"✅ Chunker test successful! Generated {len(test_chunks)} chunks:")
    for idx, c in enumerate(test_chunks, start=1):
        print(f"  Chunk {idx} (Page {c['page_number']}) -> '{c['chunk_text']}'")