import hmac
import hashlib

SALT = b"oauth_static_salt_2026"
FLAG = "pwn{04uth_st4t3_hm4c_f0rg3d_7128}"

def verify_state(state: str) -> str:
    try:
        user_id, sig = state.split(".", 1)
        expected = hmac.new(SALT, user_id.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            if user_id == "op_admin_99":
                return f"State Valid! Access Token: {FLAG}"
            return "User Authorized"
    except Exception:
        pass
    return "Invalid State"
