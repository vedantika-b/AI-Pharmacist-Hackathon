from difflib import get_close_matches

COMMON_DRUGS = [
    "paracetamol", "acetaminophen", "ibuprofen", "amoxicillin",
    "azithromycin", "metformin", "atorvastatin", "omeprazole",
    "pantoprazole", "cetirizine", "levocetirizine", "dolo",
    "crocin", "augmentin", "aspirin", "insulin",
    "amlodipine", "losartan", "telmisartan", "glimepiride",
    "clopidogrel", "diclofenac", "rabeprazole", "montelukast",
    "thyroxine", "sertraline", "fluoxetine",
    "metoprolol", "propranolol", "dorzolamide"
]

def find_closest_drug(word: str):
    matches = get_close_matches(word.lower(), COMMON_DRUGS, n=1, cutoff=0.75)
    return matches[0] if matches else None