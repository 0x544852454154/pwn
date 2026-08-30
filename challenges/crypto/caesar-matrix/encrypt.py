# Caesar Matrix Encryptor
SHIFT_KEY = [3, 7, 13, 19, 23]

def encrypt(text_bytes, shifts):
    res = []
    for i, b in enumerate(text_bytes):
        shift = shifts[i % len(shifts)]
        res.append((b + shift) % 256)
    return bytes(res)

# Intercepted transmission stored in ciphertext.hex
