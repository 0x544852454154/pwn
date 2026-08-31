#!/usr/bin/env python3
XOR_KEY = 0x5A
def encrypt(data: bytes) -> bytes:
    return bytes([b ^ XOR_KEY for b in data])
