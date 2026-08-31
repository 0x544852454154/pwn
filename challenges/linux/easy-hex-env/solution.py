with open("proc_environ.hex") as f:
    print(bytes.fromhex(f.read().strip()).decode())
