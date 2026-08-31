import base64
import json

FLAG = "pwn{jwt_n0n3_4lg0r1thm_f0rg3_9201}"

def verify_token(token: str):
    parts = token.split(".")
    if len(parts) < 2:
        return "Invalid token"
    header = json.loads(base64.urlsafe_b64decode(parts[0] + "==").decode())
    payload = json.loads(base64.urlsafe_b64decode(parts[1] + "==").decode())

    if header.get("alg") == "none":
        if payload.get("role") == "admin":
            return f"Access Granted! Flag: {FLAG}"
    return "Access Denied"

if __name__ == "__main__":
    import sys
    tok = sys.argv[1] if len(sys.argv) > 1 else ""
    print(verify_token(tok))
