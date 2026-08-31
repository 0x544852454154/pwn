with open("payload.gz.hex") as f:
    raw = bytes.fromhex(f.read().strip())
import re
m = re.search(rb"pwn\{[^}]+\}", raw)
print(m.group(0).decode())
