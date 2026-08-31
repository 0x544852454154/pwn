import json
with open("apq_store.json") as f:
    d = json.load(f)
print(d["flag"])
