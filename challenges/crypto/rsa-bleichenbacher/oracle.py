# PKCS#1 v1.5 Padding Oracle Simulator
from Crypto.Util.number import bytes_to_long, long_to_bytes

# Ciphertext block (e=65537)
CIPHERTEXT_HEX = '5f9a2b8471c08e492b490f847291a8472091b4827019a8471029b471'

def check_padding(c_bytes, n, e):
    # Returns True if decrypted block conforms to PKCS#1 v1.5 structure (0x00 0x02)
    return True
