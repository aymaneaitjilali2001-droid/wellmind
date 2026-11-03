from analysis.prompt import SYSTEM_PROMPT, build_user_prompt


def test_le_prompt_contient_les_commentaires_et_le_titre():
    survey = {"title": "Baromètre", "topic": "Charge", "questions": ["Un commentaire ?"]}
    comments = [{"id": 0, "text": "Les priorités changent."}]

    prompt = build_user_prompt(survey, comments)

    assert "Baromètre" in prompt
    assert "Les priorités changent." in prompt
    assert "JSON" in prompt


def test_le_prompt_accepte_un_sondage_vide():
    assert '"questions": []' in build_user_prompt({}, [])


def test_les_regles_interdisent_le_diagnostic_et_les_chiffres():
    assert "diagnostic" in SYSTEM_PROMPT
    assert "ni chiffre" in SYSTEM_PROMPT