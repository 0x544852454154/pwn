import json
with open("timing_measurements.json") as f:
    d = json.load(f)
print(d["flag_candidate"])
