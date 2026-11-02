import json

import pytest

from analysis.output import InvalidOutputError, parse_output

KNOWN_IDS = {0, 1, 2}
THEME = {
    "name": "Charge de travail",
    "sentiment": "CONCERN",
    "description": "Les priorités changent.",
    "commentIds": [0, 1],
    "excerpts": ["Les priorités changent."],
    "recommendations": [{"content": "Prioriser chaque semaine.", "rationale": "Priorités changeantes."}],
}


def parse(data):
    return parse_output(json.dumps(data), KNOWN_IDS, "modele-test")


def test_garde_une_reponse_valide():
    result = parse({"summary": "Résumé.", "themes": [THEME]})
    assert result["summary"] == "Résumé."
    assert result["model"] == "modele-test"
    assert result["themes"][0]["name"] == "Charge de travail"


def test_ne_garde_que_les_identifiants_connus():
    result = parse({"summary": "Résumé.", "themes": [{**THEME, "commentIds": [0, "1", 1, 99, True]}]})
    assert result["themes"][0]["commentIds"] == [0, 1]


def test_sentiment_inconnu_devient_mixed():
    result = parse({"summary": "Résumé.", "themes": [{**THEME, "sentiment": "TRISTE"}]})
    assert result["themes"][0]["sentiment"] == "MIXED"


def test_retire_un_theme_sans_nom():
    result = parse({"summary": "Résumé.", "themes": [{**THEME, "name": ""}, THEME]})
    assert len(result["themes"]) == 1


def test_donnees_insuffisantes_sans_recommandation():
    result = parse({"insufficientData": True, "themes": [THEME]})
    assert result["insufficientData"] is True
    assert result["themes"][0]["recommendations"] == []


def test_refuse_un_texte_qui_n_est_pas_du_json():
    with pytest.raises(InvalidOutputError):
        parse_output("ceci n'est pas du JSON", KNOWN_IDS, "modele-test")


def test_refuse_une_liste_a_la_place_d_un_objet():
    with pytest.raises(InvalidOutputError):
        parse([])


def test_refuse_des_themes_qui_ne_sont_pas_une_liste():
    with pytest.raises(InvalidOutputError):
        parse({"summary": "Résumé.", "themes": "aucun"})


def test_refuse_une_reponse_sans_resume():
    with pytest.raises(InvalidOutputError):
        parse({"themes": []})