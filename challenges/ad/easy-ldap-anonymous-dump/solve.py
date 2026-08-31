with open("ldap_dump.ldif") as f:
    for line in f:
        if line.startswith("description: "):
            hex_str = line.split(" ")[1].strip()
            print(bytes.fromhex(hex_str).decode())
