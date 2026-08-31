def rot47(s: str) -> str:
    res = []
    for c in s:
        j = ord(c)
        if 33 <= j <= 126:
            res.append(chr(33 + ((j + 14) % 94)))
        else:
            res.append(c)
    return "".join(res)
