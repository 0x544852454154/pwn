with open("openflow_stream.hex") as f:
    hex_str = f.read().strip()
flag_bytes = bytes.fromhex(hex_str[72:])
print(flag_bytes.decode())
