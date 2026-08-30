from flask import Flask, request, jsonify
import base64

app = Flask(__name__)

DOCUMENTS = {
    '101': {'owner': 'alice', 'title': 'Public Notes', 'data': 'V2VsY29tZSB0byBvdXIgcGxhdGZvcm0='},
    '102': {'owner': 'bob', 'title': 'Roadmap', 'data': 'UmVsZWFzZSBzY2hlZHVsZSBwbGFubmVk'},
    '1337': {'owner': 'admin', 'title': 'Master Vault Key', 'data': 'cHdubGFiY2diMGw0XzFkMHJfdDNuNG50XzN4ZjFsXzM5MTR9'}
}

@app.route('/api/v1/documents/<doc_id>', methods=['GET'])
def get_doc(doc_id):
    doc = DOCUMENTS.get(doc_id)
    if doc:
        return jsonify({'status': 'success', 'document': doc})
    return jsonify({'error': 'Document not found'}), 404

if __name__ == '__main__':
    app.run(port=9000)
