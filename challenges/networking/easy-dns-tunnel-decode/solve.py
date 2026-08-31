hex_chunks = ["70776e7b", "646e735f", "74756e6e", "336c5f68", "33785f63", "34727633", "645f3538", "32317d"]
print(bytes.fromhex("".join(hex_chunks)).decode())
