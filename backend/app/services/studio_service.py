import os

import ollama

from dotenv import load_dotenv

from backend.app.schemas.studio import StudioResponse
from retrieval.search import search_documents


load_dotenv()

STUDIO_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")


ACTION_INSTRUCTIONS = {
    "summary": (
        "Provide a concise executive summary of the documents. "
        "Identify the main purpose, important points, key obligations, "
        "and significant conclusions."
    ),
    "entities": (
        "Extract the most important entities from the documents. "
        "Include people, organizations, locations, dates, amounts, "
        "and other important named entities. Present them clearly."
    ),
    "faq": (
        "Create a useful FAQ based only on the documents. "
        "Generate important questions a reader would likely ask and "
        "provide concise answers grounded in the documents."
    ),
}


def run_studio_action(
    action: str,
    document_ids: list[str],
) -> StudioResponse:
    """
    Run a Studio action against the selected documents.
    """

    if action not in ACTION_INSTRUCTIONS:
        raise ValueError(f"Unsupported Studio action: {action}")

    if not document_ids:
        return StudioResponse(
            content="Please select at least one document.",
        )

    results = search_documents(
        query=ACTION_INSTRUCTIONS[action],
        document_ids=document_ids,
        top_k=5,
    )

    if not results:
        return StudioResponse(
            content="I could not find relevant information in the selected documents.",
        )

    context = "\n\n".join(
        f"[Source: {result['source']}, Page: {result['page_number']}]\n"
        f"{result['chunk_text']}"
        for result in results
    )

    prompt = f"""
You are Vault AI's document analysis assistant.

Analyze the provided document context and perform this task:

{ACTION_INSTRUCTIONS[action]}

Rules:
- Use ONLY the provided document context.
- Do not invent information.
- If information is unavailable, say so.
- Keep the output clear and useful.
- Preserve important numbers, names, dates, and facts exactly.

DOCUMENT CONTEXT:
{context}

OUTPUT:
"""

    response = ollama.chat(
        model=STUDIO_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return StudioResponse(
        content=response["message"]["content"].strip(),
    )