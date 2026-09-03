import os

import ollama

from dotenv import load_dotenv

from backend.app.schemas.chat import ChatResponse, Citation
from retrieval.search import search_documents


load_dotenv()
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")


def answer_question(
    query: str,
    document_ids: list[str],
) -> ChatResponse:
    """
    Retrieve relevant document chunks and generate a grounded answer
    using the local Ollama model.
    """

    results = search_documents(
        query=query,
        document_ids=document_ids,
        top_k=3,
    )

    if not results:
        return ChatResponse(
            answer="I could not find relevant information in the provided documents.",
            citations=[],
        )

    context_parts = []
    citations = []

    for result in results:
        context_parts.append(
            f"[Source: {result['source']}, Page: {result['page_number']}]\n"
            f"{result['chunk_text']}"
        )

        citations.append(
            Citation(
                source=result["source"],
                page=result["page_number"],
                snippet=result["chunk_text"],
            )
        )

    context = "\n\n".join(context_parts)

    prompt = f"""
You are Vault AI, a document question-answering assistant.

Answer the user's question using ONLY the information contained in the
provided document context.

If the answer cannot be found in the context, say:
"I could not find that information in the provided documents."

Do not invent facts.
Do not use outside knowledge.
Keep the answer clear and concise.

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{query}

ANSWER:
"""

    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    answer = response["message"]["content"].strip()

    return ChatResponse(
        answer=answer,
        citations=citations,
    )