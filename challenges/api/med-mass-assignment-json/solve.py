import json, user_service
payload = json.dumps({"is_admin": True, "role": "SYSTEM_ADMIN"})
print(user_service.update_profile(payload))
