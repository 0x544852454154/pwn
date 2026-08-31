with open("message.pb") as f:
    raw = bytes.fromhex(f.read().strip())
length = raw[1]
flag_bytes = raw[2:2+length]
print(flag_bytes.decode())
