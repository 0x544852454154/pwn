from Crypto.Cipher import AES
import os

KEY = os.urandom(16)
SECRET = b"pwn{43s_3cb_byt3_4t_4_t1m3_d3crypt_8819}"

def encrypt_oracle(user_input: bytes) -> bytes:
    data = user_input + SECRET
    pad_len = 16 - (len(data) % 16)
    data += bytes([pad_len]) * pad_len
    cipher = AES.new(KEY, AES.MODE_ECB)
    return cipher.encrypt(data)
