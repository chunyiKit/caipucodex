from unittest.mock import MagicMock, patch

from app.services.ai_service import AIServiceError


def test_ai_recommend_success(client):
    with patch("app.services.ai_service.OpenAI") as mocked_openai, patch(
        "app.services.ai_service.get_settings"
    ) as mocked_settings:
        mocked_settings.return_value.openai_api_key = "test-key"
        mocked_settings.return_value.openai_base_url = None
        mocked_settings.return_value.openai_model = "gpt-4o-mini"
        mocked_settings.return_value.openai_timeout_seconds = 30
        mocked_openai.return_value.responses.create.return_value.output_text = (
            '{"dishes": ['
            '{"recipe_id": null, "name": "番茄炒蛋", "category": "荤菜", "reason": "经典下饭"},'
            '{"recipe_id": null, "name": "冬瓜汤", "category": "汤类", "reason": "清爽解腻"}'
            ']}'
        )
        response = client.post("/api/ai/recommend", json={"preferences": ["少油"]})
        assert response.status_code == 200
        assert len(response.json()["dishes"]) == 2


def test_ai_recommend_failure(client):
    response = client.post("/api/ai/recommend", json={"preferences": []})
    assert response.status_code == 502
