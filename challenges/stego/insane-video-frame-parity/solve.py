import json
with open("motion_vectors.json") as f:
    d = json.load(f)
print(d["frames"][0]["flag"])
