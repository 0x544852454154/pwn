with open("tgs_hashes.txt") as f:
    line = f.read().strip()
hex_str = line.split("$")[5]
print(bytes.fromhex(hex_str).decode())
