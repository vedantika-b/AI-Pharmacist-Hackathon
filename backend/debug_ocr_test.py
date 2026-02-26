from services.ocr_processor import OCRProcessor

img='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
result = OCRProcessor.process_base64_image(img, 'test.png')
print(result)
