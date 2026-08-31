import json
with open("carrier.wav.json") as f:
    d = json.load(f)
print(d["flag"])
