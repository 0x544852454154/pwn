# Cookie Monster Gateway Service - pwnlab
import base64
import json
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)

# Encrypted payload block (XOR encrypted with session key)
# Decrypted when admin role is verified
ENC_FLAG = bytes.fromhex('13141d0f020118001007010410061c0c1601001b170c17061d1b030c171d170a16060c1d1d17')
XOR_KEY = b'k3y'

def xor_crypt(data: bytes, key: bytes) -> bytes:
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

@app.route('/')
def index():
    session_cookie = request.cookies.get('session')
    if not session_cookie:
        default_data = json.dumps({'user': 'guest', 'role': 'user', 'is_admin': False}).encode()
        scrambled = xor_crypt(default_data, XOR_KEY)
        encoded = base64.b64encode(scrambled).decode()
        resp = make_response(jsonify({'message': 'Welcome guest. Admin session cookie required.'}))
        resp.set_cookie('session', encoded)
        return resp

    try:
        raw_bytes = base64.b64decode(session_cookie)
        decrypted_json = xor_crypt(raw_bytes, XOR_KEY).decode()
        data = json.loads(decrypted_json)
        
        if data.get('is_admin') is True or data.get('role') == 'admin':
            flag = xor_crypt(ENC_FLAG, XOR_KEY).decode()
            return jsonify({'message': 'Welcome Administrator!', 'flag': flag})
        return jsonify({'message': f"Welcome {data.get('user', 'guest')}", 'access': 'denied'})
    except Exception:
        return jsonify({'error': 'Invalid session payload'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
