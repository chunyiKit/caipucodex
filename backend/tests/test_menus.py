def create_recipe(client, name: str, category: str = "素菜") -> dict:
    response = client.post(
        "/api/recipes",
        json={
            "name": name,
            "category": category,
            "description": "测试菜谱",
            "cooking_time": 20,
            "difficulty": "简单",
            "ingredients": [{"name": "蒜", "amount": "2瓣", "sort_order": 0}],
            "cooking_steps": [{"description": "翻炒即可", "sort_order": 0}],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_menu_save_and_ingredient_merge(client):
    first = create_recipe(client, "蒜蓉油麦菜")
    second = client.post(
        "/api/recipes",
        json={
            "name": "蒜蓉西兰花",
            "category": "素菜",
            "description": "测试菜谱",
            "cooking_time": 20,
            "difficulty": "简单",
            "ingredients": [{"name": "蒜", "amount": "3瓣", "sort_order": 0}],
            "cooking_steps": [{"description": "翻炒即可", "sort_order": 0}],
        },
    ).json()

    menu_response = client.post(
        "/api/menus",
        json={
            "title": "今晚吃什么",
            "menu_date": "2026-03-11",
            "people_count": 3,
            "is_ai_generated": False,
            "items": [
                {
                    "recipe_id": first["id"],
                    "recipe_name": first["name"],
                    "recipe_category": first["category"],
                    "image_url": first["image_url"],
                    "cooking_time": first["cooking_time"],
                    "quantity": 1,
                    "sort_order": 0,
                },
                {
                    "recipe_id": second["id"],
                    "recipe_name": second["name"],
                    "recipe_category": second["category"],
                    "image_url": second["image_url"],
                    "cooking_time": second["cooking_time"],
                    "quantity": 1,
                    "sort_order": 1,
                },
            ],
        },
    )
    assert menu_response.status_code == 201
    menu_id = menu_response.json()["id"]

    ingredients = client.get(f"/api/menus/{menu_id}/ingredients")
    assert ingredients.status_code == 200
    assert ingredients.json()["groups"][0]["items"][0]["amount"] == "5瓣"

    delete_recipe = client.delete(f"/api/recipes/{first['id']}")
    assert delete_recipe.status_code == 204

    detail = client.get(f"/api/menus/{menu_id}")
    assert detail.status_code == 200
    assert detail.json()["items"][0]["recipe_name"] == "蒜蓉油麦菜"


def test_delete_menu(client):
    menu_response = client.post(
        "/api/menus",
        json={
            "title": "AI 推荐菜单",
            "menu_date": "2026-03-11",
            "people_count": 4,
            "is_ai_generated": True,
            "ai_preferences": {"preferences": ["少油"]},
            "items": [
                {
                    "recipe_id": None,
                    "recipe_name": "清炒芦笋",
                    "recipe_category": "素菜",
                    "image_url": None,
                    "cooking_time": 12,
                    "quantity": 1,
                    "ai_reason": "清爽解腻",
                    "sort_order": 0,
                }
            ],
        },
    )
    menu_id = menu_response.json()["id"]
    delete_response = client.delete(f"/api/menus/{menu_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/menus/{menu_id}").status_code == 404
