# ocr_engine.py

import easyocr
import cv2
import numpy as np
from pdf2image import convert_from_path

reader = easyocr.Reader(['en'], gpu=False)

def extract_text(image_path: str):
    if image_path.lower().endswith(".pdf"):
        pages = convert_from_path(image_path)
        image = np.array(pages[0])
    else:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Invalid image file")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()

    image_quality = "good"
    if variance < 50:
        image_quality = "poor"
    elif variance < 150:
        image_quality = "fair"

    results = reader.readtext(image)
    extracted_text = " ".join([r[1] for r in results])
    confidence = float(np.mean([r[2] for r in results])) if results else 0.0

    has_handwriting = confidence < 0.7

    return extracted_text, confidence, image_quality, has_handwriting