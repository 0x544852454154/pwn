with open("hypercall.log") as f:
    import re
    m = re.search(r"ENC_BYTES: ([0-9a-fA-F]+)", f.read())
    print(bytes.fromhex(m.group(1)).decode())
