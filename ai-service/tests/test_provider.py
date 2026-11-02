import pytest
import requests

from analysis import provider
from analysis.provider import ProviderError, complete


class FakeResponse:
    def __init__(self, status_code=200, body=None):
        self.status_code = status_code
        self.ok = status_code < 400
        self._body = body

    def json(self):
        if self._body is None:
            raise ValueError("pas de JSON")
        return self._body


@pytest.fixture(autouse=True)
def config(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "cle-test")
    monkeypatch.setenv("AI_MODEL", "modele-test")


def fake_post(monkeypatch, response):
    monkeypatch.setattr(provider.requests, "post", lambda *args, **kwargs: response)


def test_renvoie_le_texte_et_le_modele(monkeypatch):
    body = {"choices": [{"message": {"content": '{"summary": "ok"}'}}]}
    fake_post(monkeypatch, FakeResponse(body=body))
    assert complete("système", "utilisateur") == ('{"summary": "ok"}', "modele-test")


def test_refuse_sans_cle(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "")
    with pytest.raises(ProviderError):
        complete("système", "utilisateur")


def test_panne_reseau(monkeypatch):
    def post(*args, **kwargs):
        raise requests.ConnectionError("réseau coupé")

    monkeypatch.setattr(provider.requests, "post", post)
    with pytest.raises(ProviderError):
        complete("système", "utilisateur")


def test_erreur_http_sans_contenu(monkeypatch):
    fake_post(monkeypatch, FakeResponse(status_code=429))
    with pytest.raises(ProviderError) as err:
        complete("système", "commentaire secret")
    assert "429" in str(err.value)
    assert "commentaire secret" not in str(err.value)


def test_reponse_illisible(monkeypatch):
    fake_post(monkeypatch, FakeResponse(body={"choices": []}))
    with pytest.raises(ProviderError):
        complete("système", "utilisateur")