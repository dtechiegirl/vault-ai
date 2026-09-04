from typing import Any
import re

from sqlalchemy import select

from backend.app.db.database import SessionLocal
from backend.app.db.models import Document
from backend.app.services.chat_service import answer_question

from evaluation.dataset import load_dataset


TOP_K = 3


def get_document_id(filename: str) -> str:
    with SessionLocal() as db:
        document = db.scalar(
            select(Document).where(
                Document.filename == filename
            )
        )

        if document is None:
            raise ValueError(
                f"Document not found in database: {filename}"
            )

        return document.id


NUMBER_WORDS = {
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "ten": "10",
    "eleven": "11",
    "twelve": "12",
    "thirteen": "13",
    "fourteen": "14",
    "fifteen": "15",
    "sixteen": "16",
    "seventeen": "17",
    "eighteen": "18",
    "nineteen": "19",
    "twenty": "20",
    "twenty-five": "25",
    "twenty five": "25",
    "thirty": "30",
    "forty": "40",
    "fifty": "50",
    "sixty": "60",
    "seventy": "70",
    "eighty": "80",
    "ninety": "90",
}


def normalize_text(text: str) -> str:
    """
    Normalize text so legitimate factual variations compare equally.

    Examples:
        "three (3) years" -> "3 years"
        "six (6) months" -> "6 months"
        "September 24th, 2006" -> "september 24 2006"
        "$26.00 per hour" -> "26 per hour"
        "1.5 (one and a half)" -> "1.5"
    """
    text = text.lower()

    # Normalize number words.
    for word, number in sorted(
        NUMBER_WORDS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        text = re.sub(
            rf"\b{re.escape(word)}\b",
            number,
            text,
        )

    # Normalize "one and a half" -> "1.5".
    text = re.sub(
        r"\bone\s+and\s+a\s+half\b",
        "1.5",
        text,
    )

    # Remove ordinal suffixes: 24th -> 24, 1st -> 1, etc.
    text = re.sub(
        r"\b(\d+)(st|nd|rd|th)\b",
        r"\1",
        text,
    )

    # Normalize currency.
    text = text.replace("$", "")

    # Normalize decimal currency such as 26.00 -> 26.
    text = re.sub(
        r"\b(\d+)\.00\b",
        r"\1",
        text,
    )

    # Normalize common punctuation.
    text = text.replace(",", " ")
    text = text.replace("(", " ")
    text = text.replace(")", " ")
    text = text.replace("'", "")
    text = text.replace("-", " ")

    # Normalize Nigeria/Nigerian as the same named entity.
    text = re.sub(
        r"\bnigerian\b",
        "nigeria",
        text,
    )

    # Normalize whitespace.
    return " ".join(text.split())


def fact_is_present(
    fact: str,
    generated_answer: str,
) -> bool:
    """
    Check whether a required factual phrase appears in the
    normalized generated answer.
    """
    normalized_answer = normalize_text(generated_answer)
    normalized_fact = normalize_text(fact)

    return normalized_fact in normalized_answer


def score_answer(
    generated_answer: str,
    required_facts: list[str],
) -> dict[str, Any]:
    """Score whether all required facts appear in the answer."""

    fact_results = {
        fact: fact_is_present(
            fact,
            generated_answer,
        )
        for fact in required_facts
    }

    passed = all(fact_results.values())

    return {
        "passed": passed,
        "fact_results": fact_results,
    }


def evaluate_generation() -> list[dict[str, Any]]:
    dataset = load_dataset()
    questions = dataset["golden_qa"]

    results = []

    for item in questions:
        document_id = get_document_id(
            item["source_document"]
        )

        response = answer_question(
            query=item["question"],
            document_ids=[document_id],
        )

        score = score_answer(
            generated_answer=response.answer,
            required_facts=item["required_facts"],
        )

        results.append(
            {
                "id": item["id"],
                "question": item["question"],
                "expected_answer": item["expected_answer"],
                "generated_answer": response.answer,
                "citations": response.citations,
                "required_facts": item["required_facts"],
                "fact_results": score["fact_results"],
                "passed": score["passed"],
            }
        )

    return results


if __name__ == "__main__":
    results = evaluate_generation()

    passed = sum(
        result["passed"]
        for result in results
    )

    total = len(results)

    accuracy = (
        passed / total
        if total
        else 0.0
    )

    print("\n" + "=" * 60)
    print("ANSWER ACCURACY EVALUATION")
    print("=" * 60)

    for result in results:
        status = "✓ PASS" if result["passed"] else "✗ FAIL"

        print(
            f"\n{status} {result['id']}: "
            f"{result['question']}"
        )

        print(
            f"Expected: {result['expected_answer']}"
        )

        print(
            f"Generated: {result['generated_answer']}"
        )

        print("Required facts:")

        for fact, found in result["fact_results"].items():
            symbol = "✓" if found else "✗"
            print(f"  {symbol} {fact}")

    print("\n" + "=" * 60)
    print(
        f"Answer Accuracy: "
        f"{passed}/{total} "
        f"({accuracy * 100:.2f}%)"
    )
    print("=" * 60)