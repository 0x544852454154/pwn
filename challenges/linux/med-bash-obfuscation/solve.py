with open("payload.sh") as f:
    oct_data = f.read().strip()
    # decode \ooo
    import re
    res = re.sub(r"\\([0-7]{3})", lambda m: chr(int(m.group(1), 8)), oct_data)
    print("Decoded command:", res)
