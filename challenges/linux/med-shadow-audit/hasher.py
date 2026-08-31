import hashlib
SALT = b"pwnlab_salt_"
def hash_pin(pin: int) -> str:
    return hashlib.sha256(SALT + str(pin).encode()).hexdigest()
