SHIFTS = [3, 7, 13, 19, 23]
def encrypt(text: bytes) -> bytes:
    return bytes([(b + SHIFTS[i % len(SHIFTS)]) % 256 for i, b in enumerate(text)])
