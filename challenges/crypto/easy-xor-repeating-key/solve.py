with open("encrypted.hex") as f:
    data = bytes.fromhex(f.read().strip())
key = b"SEC"
plain = bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])
print(plain.decode())
