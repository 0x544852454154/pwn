import json
with open("tx_graph.json") as f:
    d = json.load(f)
hex_str = d["tx4"]["op_return_hex"]
print(bytes.fromhex(hex_str).decode())
