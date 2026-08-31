import json
FLAG = "pwn{m4ss_4ss1gnm3nt_js0n_r0l3_3sc4l_7719}"
def update_profile(json_str):
    data = json.loads(json_str)
    user = {"username": "operator", "role": "USER", "is_admin": False}
    user.update(data) # Mass assignment vulnerability
    if user.get("role") == "SYSTEM_ADMIN" or user.get("is_admin") is True:
        return f"Admin Profile Activated -> Flag: {FLAG}"
    return "Profile updated"
