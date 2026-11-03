"""Service IA Flask de WellMind.

Rôle : analyser des commentaires DÉJÀ désidentifiés envoyés par le backend Express.
Ce service n'a aucun accès à la base de données et ne calcule aucune statistique.

Confidentialité : le contenu des commentaires n'est jamais journalisé.
"""

import hmac
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request

from analysis.output import InvalidOutputError, parse_output
from analysis.prompt import SYSTEM_PROMPT, build_user_prompt
from analysis.provider import ProviderError, complete as provider_complete
from analysis.sanitize import scrub

load_dotenv()

MAX_BODY_BYTES = 2 * 1024 * 1024


def read_comments(payload: dict) -> list[dict] | None:
    """Renvoie les commentaires filtrés, ou None si leur format est invalide."""
    comments = payload.get("comments")
    if not isinstance(comments, list):
        return None

    cleaned = []
    for comment in comments:
        if not isinstance(comment, dict):
            return None
        comment_id, text = comment.get("id"), comment.get("text")
        if not isinstance(comment_id, int) or isinstance(comment_id, bool):
            return None
        if not isinstance(text, str) or not text.strip():
            return None
        cleaned.append({"id": comment_id, "text": scrub(text)})
    return cleaned


def create_app(internal_key: str | None = None, complete=None) -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_BODY_BYTES
    expected_key = internal_key if internal_key is not None else os.environ.get("AI_INTERNAL_KEY", "")
    call_model = complete or provider_complete

    def is_authorized() -> bool:
        provided = request.headers.get("X-Internal-Key", "")
        if not expected_key:
            return False
        return hmac.compare_digest(provided.encode("utf-8"), expected_key.encode("utf-8"))

    @app.get("/health")
    def health():
        return jsonify(status="ok", service="wellmind-ai")

    @app.post("/analyze")
    def analyze():
        if not is_authorized():
            return jsonify(error="Non autorisé"), 401

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            payload = {}

        comments = read_comments(payload)
        if comments is None:
            return jsonify(error="Le champ 'comments' doit être une liste de { id, text }"), 400

        survey = payload.get("survey")
        if not isinstance(survey, dict):
            survey = {}

        try:
            raw_text, model = call_model(SYSTEM_PROMPT, build_user_prompt(survey, comments))
            result = parse_output(raw_text, {c["id"] for c in comments}, model)
        except (ProviderError, InvalidOutputError) as err:
            # Ces messages ne contiennent jamais le texte des commentaires
            app.logger.warning("Analyse IA impossible : %s", err)
            return jsonify(error="Analyse IA impossible"), 502

        return jsonify(result)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")))