from model import process_prescription_image
import json

result = process_prescription_image("sample1.jpg")

print(json.dumps(result, indent=2))