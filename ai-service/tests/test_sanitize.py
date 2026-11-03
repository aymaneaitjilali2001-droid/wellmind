from analysis.sanitize import scrub


def test_masque_les_coordonnees():
    text = "Écrire à a.b@exemple.fr, voir https://exemple.fr/x, demander à @sara ou au 06 12 34 56 78"
    assert scrub(text) == "Écrire à [e-mail], voir [lien], demander à [mention] ou au [téléphone]"


def test_laisse_un_commentaire_normal_intact():
    text = "La charge de travail est forte en fin de mois."
    assert scrub(text) == text