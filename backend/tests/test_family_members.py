def make_payload(name: str = "妈妈") -> dict:
    return {
        "name": name,
        "height_cm": 165,
        "avatar_url": "/uploads/family-members/example.png",
        "signature": "爱吃清蒸鱼",
        "body_report": None,
    }


def test_family_member_crud(client):
    response = client.post("/api/family-members", json=make_payload())
    assert response.status_code == 201
    created = response.json()
    member_id = created["id"]
    assert created["name"] == "妈妈"
    assert created["height_cm"] == 165
    assert created["signature"] == "爱吃清蒸鱼"

    list_response = client.get("/api/family-members")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    detail_response = client.get(f"/api/family-members/{member_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["name"] == "妈妈"

    update_response = client.put(
        f"/api/family-members/{member_id}",
        json={**make_payload(name="爸爸"), "height_cm": 178, "avatar_url": None},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "爸爸"
    assert update_response.json()["height_cm"] == 178
    assert update_response.json()["avatar_url"] is None
    assert update_response.json()["signature"] == "爱吃清蒸鱼"
    assert update_response.json()["body_report"] is None

    delete_response = client.delete(f"/api/family-members/{member_id}")
    assert delete_response.status_code == 204

    missing_response = client.get("/api/family-members")
    assert missing_response.status_code == 200
    assert missing_response.json() == []


def test_family_member_validation_and_upload(client):
    invalid = client.post("/api/family-members", json={"name": "   ", "height_cm": 165, "avatar_url": None})
    assert invalid.status_code == 422

    upload = client.post(
        "/api/family-members/upload-avatar",
        files={"file": ("avatar.png", b"fakepng", "image/png")},
    )
    assert upload.status_code == 201
    assert upload.json()["url"].startswith("/uploads/family-members/")


def test_update_family_member_preserves_body_report_source_image(client):
    create_response = client.post(
        "/api/family-members",
        json={
            **make_payload(),
            "body_report": {
                "weight_jin": 150.0,
                "source_image_url": "/uploads/family-member-body-reports/latest.png",
            },
        },
    )
    member_id = create_response.json()["id"]

    update_response = client.put(
        f"/api/family-members/{member_id}",
        json={
            **make_payload(),
            "body_report": {
                "weight_jin": 152.2,
                "body_type": "肥胖",
            },
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["body_report"]["weight_jin"] == 152.2
    assert update_response.json()["body_report"]["body_type"] == "肥胖"
    assert update_response.json()["body_report"]["source_image_url"] == "/uploads/family-member-body-reports/latest.png"
