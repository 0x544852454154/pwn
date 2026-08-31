FLAG = "pwn{v3rb_t4mp3r1ng_0v3rr1d3_h34d3r_9918}"
def handle_request(method, headers):
    effective = headers.get("X-HTTP-Method-Override", method)
    if effective == "RETRIEVE_SECRET":
        return f"Secret Vault Unlocked: {FLAG}"
    return "Method Not Allowed"
