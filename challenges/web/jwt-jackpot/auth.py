# JWT Verification Module - pwnlab
import jwt

SECRET_KEY = 'super_secret_production_key_123'
FLAG_CIPHER = bytes.fromhex('03040d0f1f11081d031d0c0c1b01131e131d171b140614041706001b1704140015031b17')

def xor_flag(token_sub):
    key = token_sub.encode()
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(FLAG_CIPHER)]).decode()

def verify_token(token):
    try:
        header = jwt.get_unverified_header(token)
        if header.get('alg') == 'none':
            return jwt.decode(token, options={"verify_signature": False})
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256', 'none'])
    except Exception:
        return None
