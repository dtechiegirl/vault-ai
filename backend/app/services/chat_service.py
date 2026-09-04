import os

import ollama

from dotenv import load_dotenv

from backend.app.schemas.chat import ChatMessage, ChatResponse, Citation
from retrieval.search import search_documents


load_dotenv()
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.2:3b")

def is_history_question(query: str) -> bool:
    normalized = query.lower().strip()

    history_patterns = [
        "what was my previous question",
        "what was my last question",
        "what did i ask before",
        "what did i ask previously",
        "what was the question i asked",
        "what did i just ask",
        "what was my earlier question",
        "what did i say before",
    ]

    return any(pattern in normalized for pattern in history_patterns)

def is_comparison_question(query: str) -> bool:
    normalized = query.lower().strip()

    comparison_patterns = [
        "what are the differences",
        "what is the difference",
        "differences between",
        "difference between",
        "compare",
        "comparison",
        "compare these",
        "compare the documents",
        "compare the agreements",
        "how are they different",
        "how do they differ",
        "similarities between",
        "what are the similarities",
        "what is similar",
        "how are they similar",
    ]

    return any(pattern in normalized for pattern in comparison_patterns)

def answer_question(
    query: str,
    document_ids: list[str],
    history: list[ChatMessage] | None = None,
) -> ChatResponse:
    """
    Retrieve relevant document chunks and generate a grounded answer
    using the local Ollama model.
    """
    conversation = history or []

    if is_history_question(query):
        previous_user_messages = [
            message
            for message in conversation
            if message.role == "user"
        ]

        if not previous_user_messages:
            return ChatResponse(
                answer="There is no previous question in this conversation.",
                citations=[],
            )

        previous_question = previous_user_messages[-1].content

        return ChatResponse(
            answer=f"Your previous question was: {previous_question}",
            citations=[],
        )

    if is_comparison_question(query) and len(document_ids) > 1:
        results = search_documents(
            query=query,
            document_ids=document_ids,
            top_k=3,
            per_document=True,
        )
    else:
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

    comparison_sources = list(
        dict.fromkeys(
            result["source"]
            for result in results
            if result.get("source")
        )
    )

    if is_comparison_question(query):
        source_list = "\n".join(
            f"- {source}"
            for source in comparison_sources
        )

        task_instruction = f"""
        The user is asking for a comparison between the selected documents.

        The documents represented in the provided evidence are:
        {source_list}

        Compare these documents using ONLY the evidence provided below.

        Clearly identify differences and/or similarities between the documents.
        Organize the answer by topic when possible.

        For each comparison point, state what each document says when the
        evidence is available.

        Do not assume that information missing from one retrieved chunk is
        missing from the entire document.

        Do not invent differences or similarities.

        If the provided evidence is insufficient to establish a comparison,
        say that the available evidence is insufficient rather than refusing
        to compare the documents.
        """
    else:
        task_instruction = """
        Answer the user's current question directly using ONLY the information
        contained in the provided document context.
        """

    prompt = f"""
    You are Vault AI, a document question-answering assistant.

    Use the previous conversation messages to understand the user's current
    question, especially when the user asks a follow-up question.

    {task_instruction}

    The previous conversation may contain references such as "that", "it",
    "they", or "the previous agreement". Use the conversation history to
    understand what those references mean, but do not treat previous answers
    as evidence. The document context is the only source of factual information.

    If the answer cannot be found in the document context, say:
    "I could not find that information in the provided documents."

    Do not invent facts.
    Do not use outside knowledge.
    Keep the answer clear and concise.

    DOCUMENT CONTEXT:
    {context}

    CURRENT USER QUESTION:
    {query}

    ANSWER:
    """

    messages = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in (history or [])
    ]

    messages.append(
        {
            "role": "user",
            "content": prompt,
        }
    )

    response = ollama.chat(
        model=CHAT_MODEL,
        messages=messages,
    )

    answer = response["message"]["content"].strip()

    if answer == "I could not find that information in the provided documents.":
        return ChatResponse(
            answer=answer,
            citations=[],
        )

    return ChatResponse(
        answer=answer,
        citations=citations,
    )