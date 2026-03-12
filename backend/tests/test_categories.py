def test_categories(client):
    response = client.get('/api/categories')
    assert response.status_code == 200
    assert response.json()[0] == '全部'
    assert response.json()[-1] == '甜点'
