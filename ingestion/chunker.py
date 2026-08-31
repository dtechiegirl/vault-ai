import tiktoken
from typing import List, Dict, Any

DEFAULT_CHUNK_SIZE = 500
DEFAULT_CHUNK_OVERLAP = 50
TOKENIZER_MODEL = "cl100k_base"


def get_tokenizer():
    """
    Return the tokenizer used for token-based chunking.
    """
    return tiktoken.get_encoding(TOKENIZER_MODEL)


def chunk_document_pages(
    pages_data: List[Dict[str, Any]],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Dict[str, Any]]:
    """
    Split parsed document pages into overlapping token-based chunks.

    Each chunk preserves the source filename and page/slide number
    so that retrieved results can later be cited by the RAG pipeline.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0.")

    if chunk_overlap < 0:
        raise ValueError("chunk_overlap cannot be negative.")

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size.")

    tokenizer = get_tokenizer()
    all_chunks: List[Dict[str, Any]] = []

    step = chunk_size - chunk_overlap

    for page_info in pages_data:
        text = page_info["text"].strip()

        if not text:
            continue

        page_num = page_info["page_number"]
        source_name = page_info["source"]

        token_ids = tokenizer.encode(text)
        total_tokens = len(token_ids)

        start = 0

        while start < total_tokens:
            end = start + chunk_size

            chunk_token_ids = token_ids[start:end]
            chunk_text = tokenizer.decode(chunk_token_ids).strip()

            if chunk_text:
                all_chunks.append(
                    {
                        "chunk_text": chunk_text,
                        "page_number": page_num,
                        "source": source_name,
                    }
                )

            start += step

    return all_chunks


if __name__ == "__main__":
    tokenizer = get_tokenizer()

    mock_pages = [
        {
            "text": (
                "Vault AI is a privacy-first document intelligence platform. "
                "It runs completely offline using local LLMs via Ollama. "
                "All documents are processed on-device with zero cloud dependency."
            ),
            "page_number": 1,
            "source": "sample_presentation.pptx",
        }
    ]

    test_chunks = chunk_document_pages(
        mock_pages,
        chunk_size=20,
        chunk_overlap=5,
    )

    print(
        f"Chunker test successful. "
        f"Generated {len(test_chunks)} token-based chunks:"
    )

    for idx, chunk in enumerate(test_chunks, start=1):
        token_count = len(tokenizer.encode(chunk["chunk_text"]))

        print(
            f"Chunk {idx} "
            f"({token_count} tokens | Page {chunk['page_number']}) "
            f"-> '{chunk['chunk_text']}'"
        )