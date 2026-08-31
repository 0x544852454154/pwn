asns = [28791, 28283, 25191, 28767, 13427, 24432, 13428, 26719, 25392, 25651, 24374, 13873, 14717]
flag = ""
for n in asns:
    hi, lo = divmod(n, 256)
    flag += chr(hi) + (chr(lo) if lo != 32 else "")
print("Flag:", flag.strip())
