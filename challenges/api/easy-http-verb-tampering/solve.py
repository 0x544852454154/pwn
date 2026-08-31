import gateway
print(gateway.handle_request("POST", {"X-HTTP-Method-Override": "RETRIEVE_SECRET"}))
