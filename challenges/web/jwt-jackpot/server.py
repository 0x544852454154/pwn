from flask import Flask, request, jsonify
from auth import verify_token, xor_flag

app = Flask(__name__)

@app.route('/api/admin', methods=['GET'])
def admin():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing Bearer token'}), 401
    
    token = auth_header.split(' ')[1]
    claims = verify_token(token)
    if claims and claims.get('role') == 'admin':
        flag = xor_flag(claims.get('role', 'admin'))
        return jsonify({'status': 'authorized', 'flag': flag})
    return jsonify({'error': 'Unauthorized'}), 403

if __name__ == '__main__':
    app.run(port=8080)
