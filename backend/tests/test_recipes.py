from io import BytesIO


def make_payload(name: str = "香菇青菜") -> dict:
    return {
        "name": name,
        "category": "素菜",
        "description": "清爽好做",
        "cooking_time": 12,
        "difficulty": "简单",
        "image_url": None,
        "ingredients": [{"name": "青菜", "amount": "300g", "sort_order": 0}],
        "cooking_steps": [{"description": "大火快炒", "sort_order": 0}],
    }


def test_recipe_crud(client):
    response = client.post("/api/recipes", json=make_payload())
    assert response.status_code == 201
    recipe_id = response.json()["id"]

    list_response = client.get("/api/recipes")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    detail_response = client.get(f"/api/recipes/{recipe_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["name"] == "香菇青菜"

    update_response = client.put(f"/api/recipes/{recipe_id}", json=make_payload(name="蚝油生菜"))
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "蚝油生菜"

    delete_response = client.delete(f"/api/recipes/{recipe_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/recipes/{recipe_id}")
    assert missing_response.status_code == 404


def test_recipe_filter_and_validation(client):
    client.post("/api/recipes", json=make_payload(name="清炒菠菜"))
    client.post("/api/recipes", json={**make_payload(name="冬瓜汤"), "category": "汤类"})

    response = client.get("/api/recipes", params={"category": "汤类", "search": "冬瓜"})
    assert response.status_code == 200
    assert len(response.json()) == 1

    invalid = client.post("/api/recipes", json={**make_payload(), "category": "未知"})
    assert invalid.status_code == 422


def test_upload_image(client):
    response = client.post(
        "/api/recipes/upload-image",
        files={"file": ("demo.png", b"fakepng", "image/png")},
    )
    assert response.status_code == 201
    assert response.json()["url"].startswith("/uploads/recipes/")
