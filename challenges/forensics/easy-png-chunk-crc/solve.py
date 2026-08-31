with open("flag.png.hex") as f:
    raw = bytes.fromhex(f.read().strip())
iend_idx = raw.find(b"IEND")
flag_bytes = raw[iend_idx + 8:]
print("Flag:", flag_bytes.decode())
