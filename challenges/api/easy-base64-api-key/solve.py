import base64
with open("api_token.txt") as f:
    b64 = f.read().strip()
hex_str = base64.b64decode(b64).decode()
print(bytes.fromhex(hex_str).decode())
