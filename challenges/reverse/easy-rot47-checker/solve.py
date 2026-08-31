import rot47
with open("encoded.txt") as f:
    print(rot47.rot47(f.read().strip()))
