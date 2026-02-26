import base64, httpx
p='e:\\nanded\\ocr\\sample1.jpg'
with open(p,'rb') as f:
    b=f.read()
img='data:image/jpeg;base64,'+base64.b64encode(b).decode()
print('size',len(b))
try:
    r=httpx.post('http://localhost:8000/api/v1/prescriptions/analyze', json={'image_base64':img,'filename':'sample1.jpg'}, timeout=60.0)
    print('STATUS',r.status_code)
    print(r.text)
except Exception as e:
    print('EXC',e)
