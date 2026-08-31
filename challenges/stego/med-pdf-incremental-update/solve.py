with open("report.pdf") as f:
    import re
    print(re.search(r"pwn\{[^}]+\}", f.read()).group(0))
