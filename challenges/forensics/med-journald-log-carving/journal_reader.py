with open("system.journal", "rb") as f:
    data = f.read()
import re
m = re.search(rb"pwn\{[^}]+\}", data)
if m:
    print(m.group(0).decode())
