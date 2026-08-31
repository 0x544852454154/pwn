import json
with open("dht_nodes.json") as f:
    d = json.load(f)
print(bytes.fromhex(d["flag_payload"]).decode())
