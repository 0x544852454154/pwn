with open("session.enc") as f:
    data = bytes.fromhex(f.read().strip())
    print("".join(chr(b ^ 0x5A) for b in data))
