import hmac, hashlib
SECRET = b"api_sec_k3y_99"
FLAG = "pwn{hm4c_s1gn4tur3_4p1_f0rg3d_3319}"
def verify_request(method, path, ts, body, sig):
    canonical = f"{method}:{path}:{ts}:{body}".encode()
    expected = hmac.new(SECRET, canonical, hashlib.sha256).hexdigest()
    if hmac.compare_digest(sig, expected):
        return f"Signature OK! Flag: {FLAG}"
    return "Signature Invalid"
