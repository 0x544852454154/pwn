import base64
import json

KEY = b"flask_sess_k3y"
FLAG = "pwn{s3ss10n_x0r_c00k13_f0rg3d_8819}"

def xor_crypt(data: bytes, key: bytes) -> bytes:
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

def process_cookie(cookie_str: str):
    raw = xor_crypt(base64.b64decode(cookie_str), KEY)
    sess = json.loads(raw.decode())
    if sess.get("is_admin") is True:
        return f"Welcome Admin! {FLAG}"
    return "Welcome User"
