import hmac
import hashlib
import oauth_service

user_id = "op_admin_99"
sig = hmac.new(oauth_service.SALT, user_id.encode(), hashlib.sha256).hexdigest()
state = f"{user_id}.{sig}"
print("Forged State:", state)
print(oauth_service.verify_state(state))
