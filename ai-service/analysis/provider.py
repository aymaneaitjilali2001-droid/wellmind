"""Appel au modèle de langage. Changer de fournisseur ne touche que ce fichier.

Les messages d'erreur ne reprennent jamais le contenu des commentaires.
"""

import os

import requests

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"


class ProviderError(Exception):
    pass


def complete(system: str, user: str) -> tuple[str, str]:
    """Renvoie le texte produit par le modèle et le nom du modèle."""
    api_key = os.environ.get("AI_API_KEY", "")
    if not api_key:
        raise ProviderError("AI_API_KEY manquante")

    model = os.environ.get("AI_MODEL") or DEFAULT_MODEL
    try:
        response = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
            timeout=float(os.environ.get("AI_TIMEOUT_SECONDS", "45")),
        )
    except requests.RequestException as err:
        raise ProviderError("Fournisseur d'IA injoignable") from err

    if not response.ok:
        raise ProviderError(f"Le fournisseur d'IA a renvoyé une erreur ({response.status_code})")

    try:
        return response.json()["choices"][0]["message"]["content"], model
    except (ValueError, KeyError, IndexError, TypeError) as err:
        raise ProviderError("Réponse du fournisseur d'IA illisible") from err