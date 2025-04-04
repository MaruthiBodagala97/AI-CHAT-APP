from fastapi.testclient import TestClient
from backend.main import app
import pytest
import json

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AI Chat Application API"}

def test_create_session():
    response = client.post("/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "messages" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert isinstance(data["messages"], list)
    assert len(data["messages"]) == 0

def test_get_session():
    # First create a session
    create_response = client.post("/sessions")
    session_id = create_response.json()["id"]
    
    # Then try to get it
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == session_id

def test_get_nonexistent_session():
    response = client.get("/sessions/nonexistent-id")
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"} 