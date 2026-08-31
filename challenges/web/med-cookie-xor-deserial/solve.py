import base64
import json
import server

payload = json.dumps({"user": "admin", "is_admin": True}).encode()
enc = server.xor_crypt(payload, server.KEY)
cookie = base64.b64encode(enc).decode()
print("Forged Cookie:", cookie)
print(server.process_cookie(cookie))
