"""Vérifie la structure de la réponse du modèle.

Express refait ensuite ses propres contrôles (extraits réels, chiffres, personnes) :
ici, on s'assure seulement que la réponse respecte le contrat attendu.
"""

import json

SENTIMENTS = {"CONCERN", "POSITIVE", "MIXED"}


class InvalidOutputError(Exception):
    pass


def _text(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _comment_ids(values, known_ids: set[int]) -> list[int]:
    if not isinstance(values, list):
        return []
    ids = []
    for value in values:
        # Le modèle écrit parfois "3" au lieu de 3
        if isinstance(value, str) and value.strip().isdigit():
            value = int(value)
        if isinstance(value, int) and not isinstance(value, bool) and value in known_ids and value not in ids:
            ids.append(value)
    return ids


def _recommendations(values) -> list[dict]:
    if not isinstance(values, list):
        return []
    recommendations = []
    for value in values:
        if isinstance(value, dict) and _text(value.get("content")):
            recommendations.append({"content": _text(value["content"]), "rationale": _text(value.get("rationale"))})
    return recommendations


def _theme(value, known_ids: set[int]) -> dict | None:
    if not isinstance(value, dict) or not _text(value.get("name")):
        return None
    excerpts = value.get("excerpts")
    sentiment = value.get("sentiment")
    return {
        "name": _text(value["name"]),
        "sentiment": sentiment if sentiment in SENTIMENTS else "MIXED",
        "description": _text(value.get("description")),
        "commentIds": _comment_ids(value.get("commentIds"), known_ids),
        "excerpts": [_text(e) for e in excerpts if _text(e)] if isinstance(excerpts, list) else [],
        "recommendations": _recommendations(value.get("recommendations")),
    }


def parse_output(raw_text: str, known_ids: set[int], model: str) -> dict:
    try:
        data = json.loads(raw_text)
    except (TypeError, ValueError) as err:
        raise InvalidOutputError("La réponse du modèle n'est pas un JSON valide") from err

    if not isinstance(data, dict):
        raise InvalidOutputError("La réponse du modèle n'est pas un objet JSON")

    themes = data.get("themes", [])
    if not isinstance(themes, list):
        raise InvalidOutputError("Le champ themes doit être une liste")

    insufficient = data.get("insufficientData") is True
    summary = _text(data.get("summary"))
    if not summary and not insufficient:
        raise InvalidOutputError("La réponse du modèle ne contient pas de résumé")

    limitations = data.get("limitations")
    parsed_themes = [theme for theme in (_theme(t, known_ids) for t in themes) if theme]
    if insufficient:
        for theme in parsed_themes:
            theme["recommendations"] = []

    return {
        "summary": summary,
        "insufficientData": insufficient,
        "limitations": [_text(l) for l in limitations if _text(l)] if isinstance(limitations, list) else [],
        "model": model,
        "themes": parsed_themes,
    }