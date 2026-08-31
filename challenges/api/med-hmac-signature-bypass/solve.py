import hmac, hashlib, signer
method, path, ts, body = "POST", "/api/v1/admin/flag", "1693400000", "{}"
canonical = f"{method}:{path}:{ts}:{body}".encode()
sig = hmac.new(signer.SECRET, canonical, hashlib.sha256).hexdigest()
print(signer.verify_request(method, path, ts, body, sig))
