"""Service IA Flask de WellMind.

Rôle : analyser des commentaires DÉJÀ désidentifiés envoyés par le backend Express.
Ce service n'a aucun accès à la base de données et ne calcule aucune statistique.

Confidentialité : le contenu des commentaires n'est jamais journalisé.
"""

import hmac
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()


def create_app(internal_key: str | None = None) -> Flask:
    app = Flask(__name__)
    expected_key = internal_key if internal_key is not None else os.environ.get("AI_INTERNAL_KEY", "")

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

        payload = request.get_json(silent=True) or {}
        comments = payload.get("comments")
        if not isinstance(comments, list):
            return jsonify(error="Le champ 'comments' (liste) est requis"), 400

        # L'analyse réelle (thèmes, résumé, recommandations) sera implémentée à l'étape 6.
        return jsonify(status="not_implemented", themes=[], recommendations=[]), 501

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")))
