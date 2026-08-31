from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import chat_service, studio_service


client = TestClient(app)


MOCK_RESULTS = [
    {
        "chunk_text": "The agreement establishes the terms between the parties.",
        "document_id": "test-document-123",
        "source": "test.txt",
        "page_number": 1,
        "distance": 0.12,
    }
]


def fake_chat(*args, **kwargs):
    return {
        "message": {
            "content": "The agreement establishes the terms between the parties."
        }
    }


def fake_search_documents(*args, **kwargs):
    return MOCK_RESULTS


def test_chat_endpoint(monkeypatch):
    monkeypatch.setattr(
        chat_service,
        "search_documents",
        fake_search_documents,
    )
    monkeypatch.setattr(
        chat_service.ollama,
        "chat",
        fake_chat,
    )

    response = client.post(
        "/chat",
        json={
            "query": "What is this agreement about?",
            "document_ids": ["test-document-123"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["answer"] == (
        "The agreement establishes the terms between the parties."
    )

    assert len(data["citations"]) == 1
    assert data["citations"][0]["source"] == "test.txt"
    assert data["citations"][0]["page"] == 1


def test_summary_endpoint(monkeypatch):
    monkeypatch.setattr(
        studio_service,
        "search_documents",
        fake_search_documents,
    )
    monkeypatch.setattr(
        studio_service.ollama,
        "chat",
        fake_chat,
    )

    response = client.post(
        "/summary",
        json={
            "document_ids": ["test-document-123"],
        },
    )

    assert response.status_code == 200
    assert response.json()["content"]


def test_entities_endpoint(monkeypatch):
    monkeypatch.setattr(
        studio_service,
        "search_documents",
        fake_search_documents,
    )
    monkeypatch.setattr(
        studio_service.ollama,
        "chat",
        fake_chat,
    )

    response = client.post(
        "/entities",
        json={
            "document_ids": ["test-document-123"],
        },
    )

    assert response.status_code == 200
    assert response.json()["content"]


def test_faq_endpoint(monkeypatch):
    monkeypatch.setattr(
        studio_service,
        "search_documents",
        fake_search_documents,
    )
    monkeypatch.setattr(
        studio_service.ollama,
        "chat",
        fake_chat,
    )

    response = client.post(
        "/faq",
        json={
            "document_ids": ["test-document-123"],
        },
    )

    assert response.status_code == 200
    assert response.json()["content"]