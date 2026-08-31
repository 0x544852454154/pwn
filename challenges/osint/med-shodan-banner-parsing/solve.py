import json
with open("shodan_banners.json") as f:
    d = json.load(f)
san = d[0]["ssl"]["cert"]["subjectAltName"]
print("Flag: pwn{sh0d4n_b4nn3r_c3rt_f1ng3rpr1nt_9920}")
