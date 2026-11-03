import json

from analysis.provider import ProviderError
from app import create_app

KEY = "test-internal-key-123"
HEADERS = {"X-Internal-Key": KEY}
COMMENTS = [
    {"id": 0, "text": "Les priorités changent trop souvent."},
    {"id": 1, "text": "La charge change chaque semaine."},
]
VALID_OUTPUT = {
    "summary": "Les retours évoquent des priorités changeantes.",
    "insufficientData": False,
    "limitations": [],
    "themes": [
        {
            "name": "Charge de travail",
            "sentiment": "CONCERN",
            "description": "Les priorités changent souvent.",
            "commentIds": [0, "1", 99],
            "excerpts": ["Les priorités changent trop souvent."],
            "recommendations": [{"content": "Prioriser chaque semaine.", "rationale": "Priorités changeantes."}],
        }
    ],
}


def fake_model(output):
    def complete(_system, _user):
        return (output if isinstance(output, str) else json.dumps(output)), "modele-test"

    return complete


def make_client(output=VALID_OUTPUT):
    return create_app(internal_key=KEY, complete=fake_model(output)).test_client()


def analyze(client):
    return client.post("/analyze", json={"comments": COMMENTS}, headers=HEADERS)


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
    client = create_app(internal_key="", complete=fake_model(VALID_OUTPUT)).test_client()
    res = client.post("/analyze", json={"comments": []}, headers={"X-Internal-Key": ""})
    assert res.status_code == 401


def test_analyze_exige_une_liste_de_commentaires():
    res = make_client().post("/analyze", json={}, headers=HEADERS)
    assert res.status_code == 400


def test_analyze_refuse_un_commentaire_mal_forme():
    res = make_client().post("/analyze", json={"comments": [{"id": "c1", "text": "Exemple"}]}, headers=HEADERS)
    assert res.status_code == 400


def test_analyze_renvoie_le_contrat_attendu():
    res = analyze(make_client())
    body = res.get_json()
    assert res.status_code == 200
    assert body["model"] == "modele-test"
    assert body["themes"][0]["commentIds"] == [0, 1]
    assert body["themes"][0]["recommendations"][0]["content"] == "Prioriser chaque semaine."


def test_le_modele_ne_recoit_pas_les_coordonnees():
    received = {}

    def complete(_system, user):
        received["prompt"] = user
        return json.dumps(VALID_OUTPUT), "modele-test"

    client = create_app(internal_key=KEY, complete=complete).test_client()
    text = "Écrire à a.b@exemple.fr, @sara, https://exemple.fr ou 06 12 34 56 78"
    res = client.post("/analyze", json={"comments": [{"id": 0, "text": text}]}, headers=HEADERS)

    assert res.status_code == 200
    for secret in ["a.b@exemple.fr", "@sara", "https://exemple.fr", "06 12 34 56 78"]:
        assert secret not in received["prompt"]


def test_recommandations_retirees_si_donnees_insuffisantes():
    output = {**VALID_OUTPUT, "insufficientData": True}
    body = analyze(make_client(output)).get_json()
    assert body["insufficientData"] is True
    assert body["themes"][0]["recommendations"] == []


def test_sortie_non_json_renvoie_502():
    assert analyze(make_client("ceci n'est pas du JSON")).status_code == 502


def test_themes_invalides_renvoient_502():
    assert analyze(make_client({"summary": "Résumé", "themes": "aucun"})).status_code == 502


def test_resume_absent_renvoie_502():
    assert analyze(make_client({"themes": []})).status_code == 502


def test_panne_du_fournisseur_renvoie_502_sans_contenu():
    def complete(_system, _user):
        raise ProviderError("Fournisseur d'IA injoignable")

    client = create_app(internal_key=KEY, complete=complete).test_client()
    res = analyze(client)
    assert res.status_code == 502
    assert COMMENTS[0]["text"] not in res.get_data(as_text=True)