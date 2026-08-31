import json
import base64

with open("schema.json") as f:
    data = json.load(f)
field = data["data"]["__schema"]["types"][0]["fields"][2]
val = field["defaultValue"]
print("Flag:", base64.b64decode(val).decode())
