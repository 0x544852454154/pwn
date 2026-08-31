def hash_chunk(chunk: bytes) -> int:
    h = 5381
    for b in chunk:
        h = (((h << 5) + h) ^ b) & 0xFFFFFFFF
    return h
