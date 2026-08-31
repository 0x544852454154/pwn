with open("ciphertext.hex") as f:
    cipher = bytes.fromhex(f.read().strip())
shifts = [3, 7, 13, 19, 23]
plain = bytes([(b - shifts[i % len(shifts)]) % 256 for i, b in enumerate(cipher)])
print(plain.decode())
