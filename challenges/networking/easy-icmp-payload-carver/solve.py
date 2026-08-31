import re
with open("icmp_dump.txt") as f:
    bytes_list = [int(m, 16) for m in re.findall(r"0x([0-9a-fA-F]+)", f.read())]
    print(bytes(bytes_list).decode())
