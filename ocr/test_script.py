from model import process_prescription_image
import json

result = process_prescription_image("sample3.png")

print(json.dumps(result, indent=2))