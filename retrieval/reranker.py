import re
from typing import Any


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "under",
    "what",
    "when",
    "where",
    "which",
    "who",
    "with",
}

HEADING_SYNONYMS = {
    "term": {"term", "duration", "period"},
    "governing": {"governing", "governed", "law"},
    "law": {"law", "governing", "governed"},
    "termination": {"termination", "terminate", "end", "ending"},
    "renewal": {"renewal", "renew", "extend", "extension"},
    "payment": {"payment", "pay", "fee", "fees", "financial"},
    "ownership": {"ownership", "owner", "property"},
    "access": {"access", "entry"},
}


def tokenize(text: str) -> list[str]:
    """
    Convert text into normalized words while removing
    common stop words.
    """
    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())

    return [
        word
        for word in words
        if word not in STOP_WORDS
    ]


def extract_section_headings(text: str) -> list[str]:
    """
    Extract numbered section headings from a document chunk.

    Examples:
        4. TERM
        4.1 Renewal Priority
        22. GOVERNING LAW
    """
    headings = []

    pattern = r"^\s*(\d+(?:\.\d+)?)\.\s+([A-Z][A-Z &/()-]+)\s*$"

    for line in text.splitlines():
        match = re.match(pattern, line.strip())

        if match:
            heading = match.group(2).strip()
            headings.append(heading.lower())

    return headings


def lexical_score(query: str, document: str) -> float:
    """
    Measure meaningful query-word overlap with the document.
    """
    query_tokens = set(tokenize(query))
    document_tokens = set(tokenize(document))

    if not query_tokens:
        return 0.0

    overlap = query_tokens.intersection(document_tokens)

    return len(overlap) / len(query_tokens)


def heading_score(query: str, document: str) -> float:
    """
    Measure how strongly the query matches section headings,
    including related concepts such as:

        "initial term" -> "TERM"
        "under what law" -> "GOVERNING LAW"
    """

    headings = extract_section_headings(document)

    if not headings:
        return 0.0

    query_tokens = set(tokenize(query))

    if not query_tokens:
        return 0.0

    # Expand query words using our heading concepts.
    expanded_query_tokens = set(query_tokens)

    for token in query_tokens:
        if token in HEADING_SYNONYMS:
            expanded_query_tokens.update(
                HEADING_SYNONYMS[token]
            )

    best_score = 0.0

    for heading in headings:
        heading_tokens = set(tokenize(heading))

        if not heading_tokens:
            continue

        overlap = expanded_query_tokens.intersection(
            heading_tokens
        )

        if not overlap:
            continue

        # How much of the heading is covered?
        score = len(overlap) / len(heading_tokens)

        best_score = max(best_score, score)

    return best_score


def phrase_score(query: str, document: str) -> float:
    """
    Give a small boost when meaningful consecutive query words
    appear together in the document.
    """
    query_tokens = tokenize(query)
    document_text = document.lower()

    if len(query_tokens) < 2:
        return 0.0

    phrases = [
        " ".join(query_tokens[i:i + 2])
        for i in range(len(query_tokens) - 1)
    ]

    matches = sum(
        phrase in document_text
        for phrase in phrases
    )

    return matches / len(phrases)


def rerank_results(
    query: str,
    results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Re-rank retrieved candidates using:

    - semantic similarity
    - meaningful lexical overlap
    - section-heading relevance
    - phrase matching

    Expected workflow:

        ChromaDB top 8
            ↓
        reranker
            ↓
        best results
    """

    if not results:
        return []

    max_distance = max(
        result["distance"]
        for result in results
    )

    min_distance = min(
        result["distance"]
        for result in results
    )

    distance_range = max_distance - min_distance

    for result in results:
        if distance_range == 0:
            semantic = 1.0
        else:
            semantic = (
                max_distance - result["distance"]
            ) / distance_range

        lexical = lexical_score(
            query,
            result["chunk_text"],
        )

        heading = heading_score(
            query,
            result["chunk_text"],
        )

        phrase = phrase_score(
            query,
            result["chunk_text"],
        )

        result["semantic_score"] = semantic
        result["lexical_score"] = lexical
        result["heading_score"] = heading
        result["phrase_score"] = phrase

        result["combined_score"] = (
             (0.40 * semantic)
            + (0.15 * lexical)
            + (0.40 * heading)
            + (0.05 * phrase)
        )

    return sorted(
        results,
        key=lambda result: result["combined_score"],
        reverse=True,
    )