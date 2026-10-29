from app import create_app

KEY = "test-internal-key-123"


def make_client():
    return create_app(internal_key=KEY).test_client()


def test_health_ok():
    res = make_client().get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok", "service": "wellmind-ai"}


def test_analyze_refuse_sans_cle():
    res = make_client().post("/analyze", json={"comments": []})
    assert res.status_code == 401


def test_analyze_refuse_mauvaise_cle():
    res = make_client().post("/analyze", json={"comments": []}, headers={"X-Internal-Key": "autre"})
    assert res.status_code == 401


def test_analyze_refuse_si_cle_serveur_vide():
    client = create_app(internal_key="").test_client()
    res = client.post("/analyze", json={"comments": []}, headers={"X-Internal-Key": ""})
    assert res.status_code == 401


def test_analyze_exige_une_liste_de_commentaires():
    res = make_client().post("/analyze", json={}, headers={"X-Internal-Key": KEY})
    assert res.status_code == 400


def test_analyze_pas_encore_implemente():
    res = make_client().post(
        "/analyze",
        json={"comments": [{"id": "c1", "text": "Exemple"}]},
        headers={"X-Internal-Key": KEY},
    )
    assert res.status_code == 501
