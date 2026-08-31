import re
with open("dns_zone.txt") as f:
    m = re.search(r"verification=([0-9a-fA-F]+)", f.read())
    print(bytes.fromhex(m.group(1)).decode())
