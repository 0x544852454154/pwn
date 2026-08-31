import hashlib
target = "0e215962017382049182390182348102"
candidates = ["240610708", "QNKCDZO", "s878926199a"]
for c in candidates:
    h = hashlib.md5(c.encode()).hexdigest()
    if h.startswith("0e") and h[2:].isdigit():
        print(f"Match found! Passcode: {c} -> {h}")
        print("Flag: pwn{php_m4g1c_h4sh_l00s3_c0mp4r3_4190}")
        break
