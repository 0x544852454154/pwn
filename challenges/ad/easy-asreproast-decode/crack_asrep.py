with open("asrep_hashes.txt") as f:
    line = f.read().strip()
parts = line.split("$")
hex_token = parts[3].split(":")[1]
print(bytes.fromhex(hex_token).decode())
