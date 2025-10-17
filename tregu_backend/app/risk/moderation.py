import re
prohibited = [
    re.compile(r"firearm|gun|ammunition|silencer", re.I),
    re.compile(r"explosive|grenade|dynamite|fireworks", re.I),
    re.compile(r"counterfeit|fake\s+branded", re.I),
]
def scan(text: str) -> bool:
    if not text:
        return False
    for r in prohibited:
        if r.search(text):
            return True
    return False
