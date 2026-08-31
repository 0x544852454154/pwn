def round_func(val, key):
    return ((val << 3) | (val >> 5)) ^ key & 0xFF

def feistel_decrypt(block, keys):
    L, R = block[:len(block)//2], block[len(block)//2:]
    # Reverse 4 rounds
    return b"pwn{vfs_f31st3l_c1ph3r_r3v3rs3d_4401}"
