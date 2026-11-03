"""Second filtre de désidentification, appliqué avant d'appeler le modèle.

Express masque déjà les noms, car lui seul connaît les employés. Ce filtre
ne repose donc que sur des motifs : e-mails, liens, mentions et téléphones.
"""

import re

EMAIL = re.compile(r"[\w.%+-]+@[\w.-]+\.\w{2,}")
URL = re.compile(r"\b(?:https?://|www\.)[^\s<>\"']*[^\s<>\"'.,;:!?)]", re.IGNORECASE)
MENTION = re.compile(r"(?<![\w.])@[\w.-]+")
PHONE = re.compile(r"(?:\+?\d[\s.-]?){8,}\d")


def scrub(text: str) -> str:
    text = EMAIL.sub("[e-mail]", text)
    text = URL.sub("[lien]", text)
    text = MENTION.sub("[mention]", text)
    return PHONE.sub("[téléphone]", text)