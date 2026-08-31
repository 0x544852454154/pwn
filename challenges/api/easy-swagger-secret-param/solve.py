import json, base64
with open("swagger.json") as f:
    d = json.load(f)
token = d["paths"]["/api/v2/internal/debug-export"]["get"]["parameters"][0]["schema"]["default"]
print(base64.b64decode(token).decode())
