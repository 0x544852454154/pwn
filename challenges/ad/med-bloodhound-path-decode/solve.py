import json
with open("bloodhound_export.json") as f:
    d = json.load(f)
print(d["nodes"][2]["description"].split("=")[1])
