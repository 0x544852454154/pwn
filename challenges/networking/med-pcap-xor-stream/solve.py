with open("stream.hex") as f:
    data = bytes.fromhex(f.read().strip())
key = bytes([0x13, 0x37, 0x42, 0x69])
res = bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])
print(res.decode())
