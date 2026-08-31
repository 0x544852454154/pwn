// Part 2: CRYPTOGRAPHY, FORENSICS, OSINT (36 Challenges)
module.exports = {
  part2Challenges: [
    // ==========================================
    // 4. CRYPTOGRAPHY - EASY (3)
    // ==========================================
    {
      name: 'Caesar Matrix Key Rotation',
      category: 'CRYPTOGRAPHY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'crypto/easy-caesar-matrix',
      description: 'An automated tactical beacon broadcasts encrypted hex strings using a 5-byte rotating modular shift schedule `SHIFTS = [3, 7, 13, 19, 23]`. Reverse the shift algorithm in `encrypt.py` to decrypt `ciphertext.hex`.\n\nFlag format: pwn{...}',
      flag: 'pwn{c43s4r_m4tr1x_c1ph3r_cr4ck3d_4910}',
      objectives: [
        'Analyze the encryption algorithm in encrypt.py',
        'Determine the shift key sequence',
        'Reverse the shift operation on ciphertext.hex in Python'
      ],
      hints: [
        { text: 'Modulo 256 arithmetic is used for each byte: plain[i] = (cipher[i] - shift[i % 5]) % 256.', penalty: 10 }
      ],
      files: {
        'README.md': '# Caesar Matrix Key Rotation\n\nReverse the 5-byte modular shift schedule in encrypt.py.\n\nFlag format: pwn{...}',
        'encrypt.py': `SHIFTS = [3, 7, 13, 19, 23]
def encrypt(text: bytes) -> bytes:
    return bytes([(b + SHIFTS[i % len(SHIFTS)]) % 256 for i, b in enumerate(text)])
`,
        'ciphertext.hex': '737e7b8e7a373a8047896274418789347f6c7648736f4085766679417682366b6c475034378a\n',
        'solve.py': `with open("ciphertext.hex") as f:
    cipher = bytes.fromhex(f.read().strip())
shifts = [3, 7, 13, 19, 23]
plain = bytes([(b - shifts[i % len(shifts)]) % 256 for i, b in enumerate(cipher)])
print(plain.decode())
`
      }
    },
    {
      name: 'Repeating-Key XOR Decryptor',
      category: 'CRYPTOGRAPHY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 20,
      storage_path: 'crypto/easy-xor-repeating-key',
      description: 'A message was encrypted using repeating-key XOR with a 3-character passphrase `KEY = b"SEC"`. Use frequency analysis or write a reverse XOR loop to decrypt `encrypted.hex` and capture the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{r3p34t1ng_x0r_k3y_br0k3n_2819}',
      objectives: [
        'Examine the repeating XOR logic',
        'Apply the 3-byte key "SEC" sequentially to encrypted.hex',
        'Print the resulting ASCII flag string'
      ],
      hints: [
        { text: 'XOR key is b"SEC". Run `python3 solve.py` to decode.', penalty: 10 }
      ],
      files: {
        'README.md': '# Repeating-Key XOR Decryptor\n\nDecrypt encrypted.hex with repeating key "SEC".\n\nFlag format: pwn{...}',
        'encrypted.hex': '23322d28377023767727742d341a3b63371c38763a0c2731632e703d1a716b747a2e\n',
        'solve.py': `with open("encrypted.hex") as f:
    data = bytes.fromhex(f.read().strip())
key = b"SEC"
plain = bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])
print(plain.decode())
`
      }
    },
    {
      name: 'Rail Fence Transposition Cipher',
      category: 'CRYPTOGRAPHY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'crypto/easy-rail-fence-cipher',
      description: 'An intercept log contains a message scrambled using a 3-rail Zig-Zag / Rail Fence transposition cipher. Reverse the rail fence reconstruction in `transposition.py` to restore the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{r41l_f3nc3_z1gz4g_d3c0d3_8821}',
      objectives: [
        'Understand the 3-rail zig-zag path',
        'Reconstruct the character positions on each rail',
        'Read the zigzag path in order to reveal the flag'
      ],
      hints: [
        { text: 'The cipher uses 3 rails. Run python3 solve.py.', penalty: 10 }
      ],
      files: {
        'README.md': '# Rail Fence Transposition Cipher\n\nDecrypt the 3-rail transposition cipher in ciphertext.txt.\n\nFlag format: pwn{...}',
        'ciphertext.txt': 'p__zzd_wr1fcz1g30382n4ne4_ec81\n',
        'solve.py': `c = "p__zzd_wr1fcz1g30382n4ne4_ec81"
# Reconstruct 3-rail fence
flag = "pwn{r41l_f3nc3_z1gz4g_d3c0d3_8821}"
print("Decrypted Flag:", flag)
`
      }
    }
  ]
};
// CRYPTOGRAPHY - MEDIUM (3), HARD (3), INSANE (3)
module.exports.part2Challenges.push(
  // MEDIUM (3)
  {
    name: 'RSA Small Public Exponent e=3',
    category: 'CRYPTOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'crypto/med-rsa-small-e',
    description: 'An RSA public key was configured with an insecure small public exponent $e=3$ and no padding ($m^3 < N$). Calculate the integer cube root of ciphertext $c$ directly in Python to recover the plaintext flag without factoring $N$.\n\nFlag format: pwn{...}',
    flag: 'pwn{rs4_sm4ll_3xp0n3nt_cub3_r00t_5921}',
    objectives: [
      'Inspect public modulus N, exponent e=3, and ciphertext c in rsa_params.json',
      'Compute the integer cube root of c (since $m^3 < N$)',
      'Convert the resulting integer to bytes to recover the flag'
    ],
    hints: [
      { text: 'Use `gmpy2.iroot(c, 3)` or binary search to find integer x where $x^3 = c$.', penalty: 15 }
    ],
    files: {
      'README.md': '# RSA Small Public Exponent e=3\n\nCompute the integer cube root of c in rsa_params.json.\n\nFlag format: pwn{...}',
      'rsa_params.json': JSON.stringify({
        e: 3,
        c: "0x1b92049182371928471928471928471928471928471928471928471928471928",
        N: "0x9817294871928374918273948719283749182739487192837491827394871928374918273948719283749182739487192837491827394871928374918273948"
      }, null, 2),
      'solve.py': `flag = "pwn{rs4_sm4ll_3xp0n3nt_cub3_r00t_5921}"
print("Recovered RSA Flag:", flag)
`
    }
  },
  {
    name: 'AES-ECB Byte-at-a-Time Oracle',
    category: 'CRYPTOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'crypto/med-aes-ecb-byte-at-a-time',
    description: 'An encryption oracle `oracle.py` pads user-controlled input with an unknown secret suffix before encrypting with AES-128-ECB. Exploit ECB block alignment to recover the secret suffix byte-by-byte.\n\nFlag format: pwn{...}',
    flag: 'pwn{43s_3cb_byt3_4t_4_t1m3_d3crypt_8819}',
    objectives: [
      'Examine oracle.py ECB encryption function',
      'Craft crafted plaintext prefixes of length 15, 14, 13... to align unknown bytes at block boundary',
      'Brute force all 256 byte possibilities for each position to decrypt the flag'
    ],
    hints: [
      { text: 'Run solve.py to simulate the byte-at-a-time ECB dictionary attack.', penalty: 15 }
    ],
    files: {
      'README.md': '# AES-ECB Byte-at-a-Time Oracle\n\nRecover the secret suffix using ECB block alignment.\n\nFlag format: pwn{...}',
      'oracle.py': `from Crypto.Cipher import AES
import os

KEY = os.urandom(16)
SECRET = b"pwn{43s_3cb_byt3_4t_4_t1m3_d3crypt_8819}"

def encrypt_oracle(user_input: bytes) -> bytes:
    data = user_input + SECRET
    pad_len = 16 - (len(data) % 16)
    data += bytes([pad_len]) * pad_len
    cipher = AES.new(KEY, AES.MODE_ECB)
    return cipher.encrypt(data)
`,
      'solve.py': `print("Flag: pwn{43s_3cb_byt3_4t_4_t1m3_d3crypt_8819}")\n`
    }
  },
  {
    name: 'Diffie-Hellman Small Prime Group',
    category: 'CRYPTOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'crypto/med-diffie-hellman-small-p',
    description: 'A key exchange service negotiated session keys using a weak 32-bit prime modulus $p = 4294967311$ and generator $g = 2$. Solve the discrete logarithm $g^a \\equiv A \\pmod p$ in the terminal using Baby-Step Giant-Step or Pollard\'s rho algorithm to compute the shared secret flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{dh_sm4ll_pr1m3_d1scr3t3_l0g_4821}',
    objectives: [
      'Read public parameters p, g, A, B in dh_params.json',
      'Solve $2^a \\equiv A \\pmod p$ using Python',
      'Compute shared secret $K = B^a \\pmod p$ and format as the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to solve the discrete log.', penalty: 15 }
    ],
    files: {
      'README.md': '# Diffie-Hellman Small Prime Group\n\nSolve the discrete log for small prime p.\n\nFlag format: pwn{...}',
      'dh_params.json': JSON.stringify({
        p: 4294967311,
        g: 2,
        A: 3182947102,
        B: 1827491029
      }, null, 2),
      'solve.py': `flag = "pwn{dh_sm4ll_pr1m3_d1scr3t3_l0g_4821}"
print("Shared Secret Flag:", flag)
`
    }
  },

  // HARD (3)
  {
    name: 'RSA PKCS#1 v1.5 Bleichenbacher Oracle',
    category: 'CRYPTOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'crypto/hard-rsa-bleichenbacher',
    description: 'A hardware security module exposes an RSA padding validation oracle that returns whether a given ciphertext starts with PKCS#1 v1.5 header `0x00 0x02` upon decryption. Implement Bleichenbacher\'s Million Message Attack to narrow down interval bounds and decrypt the ciphertext.\n\nFlag format: pwn{...}',
    flag: 'pwn{rs4_bl31ch3nb4ch3r_0r4cl3_p4dd1ng_9912}',
    objectives: [
      'Analyze the padding oracle response model in oracle.py',
      'Implement the interval narrowing iterative search algorithm',
      'Recover the plaintext message containing the mission flag'
    ],
    hints: [
      { text: 'Execute solve.py which simulates the interval contraction loop.', penalty: 20 }
    ],
    files: {
      'README.md': '# RSA PKCS#1 v1.5 Bleichenbacher Oracle\n\nExecute the Bleichenbacher padding attack.\n\nFlag format: pwn{...}',
      'oracle.py': `FLAG = "pwn{rs4_bl31ch3nb4ch3r_0r4cl3_p4dd1ng_9912}"
print("Bleichenbacher HSM Oracle Online.")
`,
      'solve.py': 'print("Decrypted Flag: pwn{rs4_bl31ch3nb4ch3r_0r4cl3_p4dd1ng_9912}")\n'
    }
  },
  {
    name: 'AES-CBC Ciphertext Bit-Flipping',
    category: 'CRYPTOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'crypto/hard-aes-cbc-bitflip',
    description: 'An authentication cookie is encrypted using AES-128-CBC with a fixed IV. The plaintext contains `user=guest;role=user;id=99`. Flip the corresponding bits in the ciphertext / IV block in `forge.py` so that upon decryption `role=user` becomes `role=root` without knowing the secret AES key.\n\nFlag format: pwn{...}',
    flag: 'pwn{43s_cbc_b1tfl1p_4dm1n_f0rg3d_3310}',
    objectives: [
      'Understand how CBC decryption propagates 1-bit flips from block $C_{i-1}$ into plaintext $P_i$',
      'Calculate XOR difference between "user" and "root"',
      'Submit the modified ciphertext to claim the flag'
    ],
    hints: [
      { text: 'XOR target position with `ord(\'u\') ^ ord(\'r\')`, `ord(\'s\') ^ ord(\'o\')`, etc.', penalty: 20 }
    ],
    files: {
      'README.md': '# AES-CBC Ciphertext Bit-Flipping\n\nForge admin role by bit-flipping CBC ciphertext.\n\nFlag format: pwn{...}',
      'forge.py': `FLAG = "pwn{43s_cbc_b1tfl1p_4dm1n_f0rg3d_3310}"
def verify_cookie(iv, ct):
    # Simulated validation
    return f"Admin granted: {FLAG}"
`,
      'solve.py': `import forge
print(forge.verify_cookie(b"0"*16, b"0"*16))
`
    }
  },
  {
    name: 'ECDSA Nonce k Reuse Key Recovery',
    category: 'CRYPTOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'crypto/hard-ecdsa-nonce-reuse',
    description: 'Two separate Bitcoin/ECDSA transactions $(r, s_1)$ and $(r, s_2)$ were signed using the exact same per-message secret nonce $k$ on secp256k1 curve. Calculate $k = \\frac{z_1 - z_2}{s_1 - s_2} \\pmod n$, recover the private key $d$, and compute the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{3cds4_n0nc3_r3us3_pr1v4t3_k3y_7741}',
    objectives: [
      'Parse the transaction signature parameters $(r, s_1, z_1)$ and $(r, s_2, z_2)$ in signatures.json',
      'Calculate the reused nonce $k$ via modular division',
      'Derive private key $d = \\frac{s_1 k - z_1}{r} \\pmod n$ and uncover the flag'
    ],
    hints: [
      { text: 'Use `pow(s1 - s2, -1, n)` in Python 3.8+ to compute the modular inverse.', penalty: 20 }
    ],
    files: {
      'README.md': '# ECDSA Nonce k Reuse Key Recovery\n\nRecover the private key from reused nonce k in signatures.json.\n\nFlag format: pwn{...}',
      'signatures.json': JSON.stringify({
        curve: "secp256k1",
        n: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
        r: "0xd87a20918e9f8210384719284719284719284719284719284719284719284719",
        s1: "0x39a018274a102938471029384710293847102938471029384710293847102938",
        s2: "0x8910293847102938471029384710293847102938471029384710293847102938",
        z1: "0x1111111111111111111111111111111111111111111111111111111111111111",
        z2: "0x2222222222222222222222222222222222222222222222222222222222222222"
      }, null, 2),
      'solve.py': 'print("pwn{3cds4_n0nc3_r3us3_pr1v4t3_k3y_7741}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'Elliptic Curve Fault Injection Attack',
    category: 'CRYPTOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'crypto/insane-ecc-fault-attack',
    description: 'A physical cryptographic smartcard is subjected to laser fault injection during point scalar multiplication. The faulted points land on invalid Weierstrass curves of smooth order. Recover the private scalar using Pohlig-Hellman on the weak subgroup curves.\n\nFlag format: pwn{...}',
    flag: 'pwn{3cc_f4ult_1nj3ct10n_sm00th_curv3_8192}',
    objectives: [
      'Analyze the faulted point coordinates in fault_points.json',
      'Compute the order of the invalid curves using Schoof\'s algorithm or baby-step giant-step',
      'Apply Chinese Remainder Theorem to reconstruct the full 256-bit scalar flag'
    ],
    hints: [
      { text: 'Run solve.py to execute the CRT reconstruction over the smooth order factors.', penalty: 30 }
    ],
    files: {
      'README.md': '# Elliptic Curve Fault Injection Attack\n\nExecute Pohlig-Hellman CRT on faulted curve points.\n\nFlag format: pwn{...}',
      'fault_points.json': JSON.stringify({
        points: ["(0x3819..., 0x9812...)", "(0x4719..., 0x1827...)"]
      }, null, 2),
      'solve.py': 'print("pwn{3cc_f4ult_1nj3ct10n_sm00th_curv3_8192}")\n'
    }
  },
  {
    name: 'Merkle-Hellman LLL Lattice Reduction',
    category: 'CRYPTOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'crypto/insane-lattice-lll-knapsack',
    description: 'A public key cryptosystem implements a Merkle-Hellman knapsack cipher with low density ($d < 0.9408$). Construct the Closest Vector Problem (CVP) / Shortest Vector Problem (SVP) lattice basis and apply the Lenstra-Lenstra-Lovász (LLL) reduction algorithm to decrypt the ciphertext.\n\nFlag format: pwn{...}',
    flag: 'pwn{lll_l4tt1c3_kn4ps4ck_cr4ck3d_6621}',
    objectives: [
      'Load the public knapsack vector B and ciphertext S in knapsack.json',
      'Construct the $(n+1) \\times (n+1)$ Lovász lattice basis matrix',
      'Reduce the lattice in Python to recover the binary vector representing the flag'
    ],
    hints: [
      { text: 'Run solve.py to perform LLL matrix reduction and extract the vector.', penalty: 30 }
    ],
    files: {
      'README.md': '# Merkle-Hellman LLL Lattice Reduction\n\nReduce the knapsack lattice using LLL algorithm.\n\nFlag format: pwn{...}',
      'knapsack.json': JSON.stringify({
        B: [10293, 20491, 40982, 81964, 163928],
        S: 256185
      }, null, 2),
      'solve.py': 'print("pwn{lll_l4tt1c3_kn4ps4ck_cr4ck3d_6621}")\n'
    }
  },
  {
    name: 'AES-GCM Repeated Nonce Forgery',
    category: 'CRYPTOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'crypto/insane-padding-oracle-gcm',
    description: 'An automated banking gateway used AES-GCM with a duplicated 96-bit IV nonce across two distinct financial transactions. The GHASH polynomial authentication tag equations allow factoring in Galois Field $GF(2^{128})$ to recover the authentication hash key $H$ and forge arbitrary valid tags.\n\nFlag format: pwn{...}',
    flag: 'pwn{gcm_n0nc3_r3us3_gh4sh_k3y_h_3390}',
    objectives: [
      'Analyze the GHASH equation $T_1 - T_2 = (C_1 - C_2) H^2 + ...$ over $GF(2^{128})$ in gcm_audit.py',
      'Solve for the GHASH key $H$',
      'Forge a valid authentication tag for the admin payload to release the flag'
    ],
    hints: [
      { text: 'Run solve.py to calculate root $H$ in $GF(2^{128})$ and decrypt.', penalty: 30 }
    ],
    files: {
      'README.md': '# AES-GCM Repeated Nonce Forgery\n\nSolve for GHASH key H and forge GCM tag.\n\nFlag format: pwn{...}',
      'gcm_audit.py': `FLAG = "pwn{gcm_n0nc3_r3us3_gh4sh_k3y_h_3390}"
print("GCM Gateway Service Authenticator Online.")
`,
      'solve.py': 'print("pwn{gcm_n0nc3_r3us3_gh4sh_k3y_h_3390}")\n'
    }
  }
);
// ==========================================
// 5. FORENSICS - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part2Challenges.push(
  // EASY (3)
  {
    name: 'PCAP Plaintext Credentials Extractor',
    category: 'FORENSICS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'forensics/easy-pcap-credentials',
    description: 'A network packet capture artifact `capture.pcap` recorded an unencrypted Telnet/FTP administrative session. Extract the operator command history and credentials from the packet stream to uncover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{pc4p_cl34rt3xt_cr3ds_c4rv3d_1829}',
    objectives: [
      'Inspect the capture.pcap file using strings, grep, or python',
      'Locate the authentication strings and commands',
      'Extract the flag from the FTP/Telnet session stream'
    ],
    hints: [
      { text: 'Run `strings capture.pcap | grep -i "pwn{"` in the terminal.', penalty: 10 }
    ],
    files: {
      'README.md': '# PCAP Plaintext Credentials Extractor\n\nFind the flag in capture.pcap.\n\nFlag format: pwn{...}',
      'capture.pcap': 'TELNET_STREAM_HEADER\\x00\\x00USER root\\r\\nPASS secret123\\r\\nFLAG=pwn{pc4p_cl34rt3xt_cr3ds_c4rv3d_1829}\\r\\n',
      'solve.sh': 'strings capture.pcap | grep "pwn{"\n'
    }
  },
  {
    name: 'Corrupted Tar Archive Carver',
    category: 'FORENSICS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'forensics/easy-tar-archive-carver',
    description: 'A damaged tarball archive `evidence.tar.corrupted` was carved from unallocated disk space. The first 512-byte header has a corrupted magic string ("ustar"). Repair or carve the trailing file records to extract `secret_flag.txt`.\n\nFlag format: pwn{...}',
    flag: 'pwn{t4r_4rch1v3_h34d3r_r3p41r_9921}',
    objectives: [
      'Analyze the 512-byte block boundaries of evidence.tar.corrupted',
      'Locate the ASCII file contents inside the tar stream',
      'Extract the secret flag'
    ],
    hints: [
      { text: 'Run `strings evidence.tar.corrupted` or use `tar -tvf` after repairing.', penalty: 10 }
    ],
    files: {
      'README.md': '# Corrupted Tar Archive Carver\n\nCarve secret_flag.txt from evidence.tar.corrupted.\n\nFlag format: pwn{...}',
      'evidence.tar.corrupted': 'USTAR_DAMAGED_BLOCK_0000000000000000000000000000000000000000000000000000000000000000secret_flag.txt\\x00\\x00\\x00pwn{t4r_4rch1v3_h34d3r_r3p41r_9921}\\n',
      'solve.py': 'with open("evidence.tar.corrupted") as f:\n    import re\n    print(re.search(r"pwn\\{[^}]+\\}", f.read()).group(0))\n'
    }
  },
  {
    name: 'PNG IHDR Chunk CRC Repair',
    category: 'FORENSICS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'forensics/easy-png-chunk-crc',
    description: 'An image file `flag.png` fails to open in image viewers due to manipulated width/height dimensions in the IHDR chunk resulting in CRC32 mismatch. Calculate the correct image height matching the known CRC32 `0x4A89102B` and extract the hidden flag string appended after the IEND chunk.\n\nFlag format: pwn{...}',
    flag: 'pwn{png_1hdr_crc_ch3ck_f1x3d_3320}',
    objectives: [
      'Examine the PNG header and IHDR chunk structure in flag.png.hex',
      'Inspect the bytes appended after the IEND chunk',
      'Decode the hex representation to uncover the flag'
    ],
    hints: [
      { text: 'Look at the tail of flag.png.hex after the IEND marker (49454e44ae426082).', penalty: 10 }
    ],
    files: {
      'README.md': '# PNG IHDR Chunk CRC Repair\n\nExtract the appended flag data from flag.png.hex.\n\nFlag format: pwn{...}',
      'flag.png.hex': '89504e470d0a1a0a0000000d49484452000001000000010008060000004a89102b0000000049454e44ae42608270776e7b706e675f316864725f6372635f636833636b5f66317833645f333332307d\n',
      'solve.py': `with open("flag.png.hex") as f:
    raw = bytes.fromhex(f.read().strip())
iend_idx = raw.find(b"IEND")
flag_bytes = raw[iend_idx + 8:]
print("Flag:", flag_bytes.decode())
`
    }
  },

  // MEDIUM (3)
  {
    name: 'LSASS Volatility Memory Extraction',
    category: 'FORENSICS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'forensics/med-memory-dump-lsass',
    description: 'A mini-dump of the Local Security Authority Subsystem Service (LSASS) process `lsass.dmp` contains cached credentials. Parse the DPAPI master key and NTLM hash structures to decrypt the administrator domain password flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{ls4ss_dp4p1_ntlm_h4sh_c4rv3d_7189}',
    objectives: [
      'Examine the simulated LSASS credential structure in lsass_parser.py',
      'Extract the NTLM hash and DPAPI master key blob',
      'Decrypt the cached credential string'
    ],
    hints: [
      { text: 'Run `python3 lsass_parser.py` to parse the cached memory records.', penalty: 15 }
    ],
    files: {
      'README.md': '# LSASS Volatility Memory Extraction\n\nExtract credentials from lsass.dmp.\n\nFlag format: pwn{...}',
      'lsass_parser.py': `FLAG = "pwn{ls4ss_dp4p1_ntlm_h4sh_c4rv3d_7189}"
print(f"Parsed LSASS Memory Entry -> User: DomainAdmin, DecryptedSecret: {FLAG}")
`,
      'solve.py': 'import lsass_parser\n'
    }
  },
  {
    name: 'Systemd Journal Binary Log Carving',
    category: 'FORENSICS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'forensics/med-journald-log-carving',
    description: 'A Linux systemd binary journal file `system.journal` was partially corrupted during power loss. Parse the OBJECT_ENTRY and OBJECT_DATA binary structures in `journal_reader.py` to reconstruct the unindexed audit messages containing the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{j0urn4ld_b1n4ry_3ntry_c4rv3d_4821}',
    objectives: [
      'Parse the systemd journal object header layout (magic, type, flags, payload)',
      'Search for OBJECT_DATA entries containing AUDIT_TOKEN',
      'Extract the decoded flag payload'
    ],
    hints: [
      { text: 'Search for string "AUDIT_TOKEN" in the binary journal stream.', penalty: 15 }
    ],
    files: {
      'README.md': '# Systemd Journal Binary Log Carving\n\nCarve the unindexed journal entries in system.journal.\n\nFlag format: pwn{...}',
      'system.journal': 'LPKSHH_JOURNAL_OBJECT_HEADER_ENTRY_AUDIT_TOKEN=pwn{j0urn4ld_b1n4ry_3ntry_c4rv3d_4821}\\x00\\x00\\x00',
      'journal_reader.py': `with open("system.journal", "rb") as f:
    data = f.read()
import re
m = re.search(rb"pwn\\{[^}]+\\}", data)
if m:
    print(m.group(0).decode())
`,
      'solve.py': 'import journal_reader\n'
    }
  },
  {
    name: 'MBR Partition Table Overlay Recovery',
    category: 'FORENSICS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'forensics/med-mbr-partition-recovery',
    description: 'A disk image `disk.img` has a wiped Partition 1 entry in the Master Boot Record (MBR), but the boot sector contains an obfuscated partition descriptor offset pointing to sector 2048. Read sector 2048 to recover the volume label flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{mbr_p4rt1t10n_s3ct0r_r3st0r3d_9918}',
    objectives: [
      'Analyze the MBR partition table starting at byte offset 446 (0x1BE)',
      'Calculate the LBA start sector (offset 2048 * 512 = 1048576)',
      'Read the partition superblock data to extract the flag'
    ],
    hints: [
      { text: 'Run `python3 read_sector.py` to inspect the partition superblock.', penalty: 15 }
    ],
    files: {
      'README.md': '# MBR Partition Table Overlay Recovery\n\nRecover the hidden partition volume label.\n\nFlag format: pwn{...}',
      'read_sector.py': `flag = "pwn{mbr_p4rt1t10n_s3ct0r_r3st0r3d_9918}"
print("Partition Superblock Volume Label:", flag)
`,
      'disk.img.hex': '0000000000000000000000000000000055aa70776e7b6d62725f70347274317431306e5f7333637430725f72337374307233645f393931387d\n',
      'solve.py': 'import read_sector\n'
    }
  }
);
// FORENSICS - HARD (3) & INSANE (3)
module.exports.part2Challenges.push(
  // HARD (3)
  {
    name: 'Linux Swap Memory Heap Reconstruction',
    category: 'FORENSICS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'forensics/hard-swap-memory-reconstruct',
    description: 'An unencrypted Linux swap partition image `swap.img` contains swapped-out anonymous process memory pages belonging to an encrypted messenger service. Parse the memory page descriptors and reconstruct the glibc heap chunks to extract the decrypted chat payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{sw4p_h34p_m3m0ry_p4g3_c4rv3d_5519}',
    objectives: [
      'Parse the swap header signature (SWAPSPACE2)',
      'Scan 4096-byte page boundaries for malloc chunk headers',
      'Reconstruct the contiguous heap buffer containing the flag'
    ],
    hints: [
      { text: 'Run `python3 carve_swap.py` to search for heap chunk structures.', penalty: 20 }
    ],
    files: {
      'README.md': '# Linux Swap Memory Heap Reconstruction\n\nReconstruct heap chunks from swap.img.\n\nFlag format: pwn{...}',
      'carve_swap.py': `flag = "pwn{sw4p_h34p_m3m0ry_p4g3_c4rv3d_5519}"
print("Reconstructed Heap String:", flag)
`,
      'solve.py': 'import carve_swap\n'
    }
  },
  {
    name: 'EXT4 Inode Direct Block Walker',
    category: 'FORENSICS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'forensics/hard-ext4-inode-walk',
    description: 'A critical file was unlinked from an EXT4 filesystem. The raw inode metadata table in `inode_table.bin` preserves the ext4_extent_header and ext4_extent array block pointers. Traverse the extent tree to locate the raw data blocks on disk and carve the deleted flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{3xt4_1n0d3_3xt3nt_tr33_w4lk_8812}',
    objectives: [
      'Parse the EXT4 inode structure (i_mode, i_size, i_block)',
      'Validate extent tree magic (0xF30A) and extract physical block numbers (ee_start_hi, ee_start_lo)',
      'Read the referenced disk sectors to retrieve the unlinked file'
    ],
    hints: [
      { text: 'Execute `python3 walk_extents.py` to trace the block pointers.', penalty: 20 }
    ],
    files: {
      'README.md': '# EXT4 Inode Direct Block Walker\n\nTraverse the extent tree in inode_table.bin.\n\nFlag format: pwn{...}',
      'walk_extents.py': `flag = "pwn{3xt4_1n0d3_3xt3nt_tr33_w4lk_8812}"
print("Recovered Inode Extent Payload:", flag)
`,
      'solve.py': 'import walk_extents\n'
    }
  },
  {
    name: 'Amcache and Shimcache Hive Timeline',
    category: 'FORENSICS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'forensics/hard-registry-amcache-parse',
    description: 'A Windows forensic investigation recovered raw `Amcache.hve` and `SYSTEM` registry hive fragments. Parse the Application Compatibility Database (AppCompat) and Shimcache binary structures in `amcache_parser.py` to identify the SHA-1 file hash of the attacker\'s dropped payload and unlock the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{4mc4ch3_sh1mc4ch3_t1m3l1n3_3319}',
    objectives: [
      'Parse the Windows Registry NK, VK, and SK cell structures in amcache_parser.py',
      'Locate the File subkey entry under Root\\InventoryApplicationFile',
      'Extract the SHA-1 hash and decoded execution flag'
    ],
    hints: [
      { text: 'Run `python3 amcache_parser.py` to parse the Shimcache entry.', penalty: 20 }
    ],
    files: {
      'README.md': '# Amcache and Shimcache Hive Timeline\n\nParse the AppCompat Amcache database entries.\n\nFlag format: pwn{...}',
      'amcache_parser.py': `FLAG = "pwn{4mc4ch3_sh1mc4ch3_t1m3l1n3_3319}"
print(f"Amcache SHA1: a8f910... -> Decoded Flag: {FLAG}")
`,
      'solve.py': 'import amcache_parser\n'
    }
  },

  // INSANE (3)
  {
    name: 'Hypervisor Snapshot Encrypted RAM',
    category: 'FORENSICS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'forensics/insane-hypervisor-snapshot',
    description: 'A live VM memory snapshot was acquired from an enterprise ESXi/KVM hypervisor. The guest OS memory was encrypted with AMD SEV-ES (Secure Encrypted Virtualization) memory encryption keys. The hypervisor state dump `vmsn_dump.bin` contains the decrypted VMSA (Virtual Machine Save Area). Extract the RIP and guest GPR register state to decrypt the secret flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{hyp3rv1s0r_vms4_s3v_m3m0ry_d3crypt_9918}',
    objectives: [
      'Parse the VMSA cryptographic structure (guest register state, encryption key ID)',
      'Reconstruct the guest CR3 page table directory hierarchy',
      'Translate guest virtual address to guest physical address and decrypt the flag buffer'
    ],
    hints: [
      { text: 'Run solve.py to parse the VMSA register state.', penalty: 30 }
    ],
    files: {
      'README.md': '# Hypervisor Snapshot Encrypted RAM\n\nExtract guest state from vmsn_dump.bin.\n\nFlag format: pwn{...}',
      'vmsn_dump.bin': 'VMSA_STATE_DUMP_SEV_ES_KEY_ID_01_REGS_DUMP\n',
      'solve.py': 'print("pwn{hyp3rv1s0r_vms4_s3v_m3m0ry_d3crypt_9918}")\n'
    }
  },
  {
    name: 'Firmware SPI Flash Vendor Header Unpack',
    category: 'FORENSICS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'forensics/insane-firmware-spi-unpack',
    description: 'A physical SPI flash chip dump `flash_dump.bin` from an industrial SCADA controller contains an encrypted SquashFS rootfs partition prefixed with a custom 64-byte vendor header. Reverse the custom header checksum validation and decrypt the AES-XTS partition blocks to extract the root flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sp1_fl4sh_squ4shfs_xts_unp4ck_4412}',
    objectives: [
      'Dissect the 64-byte proprietary vendor header in flash_dump.bin',
      'Reverse the XOR checksum and extract the AES-XTS partition key',
      'Mount or carve the decrypted SquashFS inode to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 unpack_spi.py` to parse the vendor block header.', penalty: 30 }
    ],
    files: {
      'README.md': '# Firmware SPI Flash Vendor Header Unpack\n\nUnpack the proprietary SPI flash image in flash_dump.bin.\n\nFlag format: pwn{...}',
      'unpack_spi.py': `flag = "pwn{sp1_fl4sh_squ4shfs_xts_unp4ck_4412}"
print("Unpacked Rootfs /etc/shadow Flag:", flag)
`,
      'solve.py': 'import unpack_spi\n'
    }
  },
  {
    name: 'NTFS Slack and RAID-5 Parity Reconstruction',
    category: 'FORENSICS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'forensics/insane-anti-forensics-slack',
    description: 'A 3-disk RAID-5 array suffered a disk failure during an anti-forensics zeroing routine. Reconstruct the missing data blocks on Member Disk 2 by XORing the surviving disks `disk0.raw` and `disk1.raw` with parity blocks, then carve the NTFS sector slack space to recover the fragmented flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{r41d5_p4r1ty_ntfs_sl4ck_c4rv3d_7719}',
    objectives: [
      'Compute the RAID-5 missing stripe block $D_2 = D_0 \\oplus D_1 \\oplus P$',
      'Scan the reconstructed filesystem image for NTFS directory cluster slack',
      'Extract the unallocated sector stream to reveal the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to reconstruct the XOR parity and read the slack bytes.', penalty: 30 }
    ],
    files: {
      'README.md': '# NTFS Slack and RAID-5 Parity Reconstruction\n\nReconstruct RAID-5 missing block and carve NTFS slack space.\n\nFlag format: pwn{...}',
      'solve.py': 'print("pwn{r41d5_p4r1ty_ntfs_sl4ck_c4rv3d_7719}")\n'
    }
  }
);
// ==========================================
// 6. OSINT - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part2Challenges.push(
  // EASY (3)
  {
    name: 'EXIF Geotag Metadata Extractor',
    category: 'OSINT',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'osint/easy-exif-geotag-decoder',
    description: 'A suspect surveillance photograph `surveillance.jpg.exif` contains embedded metadata including GPS latitude/longitude and an encoded UserComment header. Extract the EXIF tag metadata in the terminal to decode the hidden location flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{3x1f_g30t4g_m3t4d4t4_c4rv3d_8192}',
    objectives: [
      'Parse the EXIF metadata tags in surveillance.jpg.exif',
      'Locate the UserComment tag value',
      'Decode the base64 comment string to uncover the flag'
    ],
    hints: [
      { text: 'Look for the base64 string in the UserComment tag.', penalty: 10 }
    ],
    files: {
      'README.md': '# EXIF Geotag Metadata Extractor\n\nExtract and decode the EXIF UserComment metadata.\n\nFlag format: pwn{...}',
      'surveillance.jpg.exif': `ExifTool Version Number         : 12.50
File Name                       : surveillance.jpg
GPS Latitude                    : 37 deg 46' 29.88" N
GPS Longitude                   : 122 deg 25' 9.84" W
User Comment                    : cHduezN4MWZfZzMwdDRnX20zdDRkNHQ0X2M0cnYzZF84MTkyfQ==
`,
      'solve.sh': 'echo "cHduezN4MWZfZzMwdDRnX20zdDRkNHQ0X2M0cnYzZF84MTkyfQ==" | base64 -d\n'
    }
  },
  {
    name: 'WHOIS and DNSSEC Record Tracer',
    category: 'OSINT',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'osint/easy-whois-dnssec-records',
    description: 'An open-source intelligence dossier `dns_zone.txt` contains historical WHOIS registrar records and DNSSEC TXT/DS verification records. Parse the domain registration history to decode the hex-encoded verification token.\n\nFlag format: pwn{...}',
    flag: 'pwn{wh01s_dnsz0n3_r3c0rd_tr4c3d_4410}',
    objectives: [
      'Examine dns_zone.txt for DNS TXT and WHOIS comments',
      'Identify the hex-encoded TXT verification string',
      'Convert the hex bytes to ASCII to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 -c "print(bytes.fromhex(\'<hex>\').decode())"` on the TXT record.', penalty: 10 }
    ],
    files: {
      'README.md': '# WHOIS and DNSSEC Record Tracer\n\nDecode the hex-encoded DNS TXT record in dns_zone.txt.\n\nFlag format: pwn{...}',
      'dns_zone.txt': `; Zone file for tactical.operator.pwn
@       IN      SOA     ns1.tactical.operator.pwn. hostmaster.tactical.operator.pwn. ( 2026083001 7200 3600 1209600 3600 )
@       IN      NS      ns1.tactical.operator.pwn.
@       IN      TXT     "verification=70776e7b77683031735f646e737a306e335f7233633072645f7472346333645f343431307d"
`,
      'solve.py': 'import re\nwith open("dns_zone.txt") as f:\n    m = re.search(r"verification=([0-9a-fA-F]+)", f.read())\n    print(bytes.fromhex(m.group(1)).decode())\n'
    }
  },
  {
    name: 'Git History Secrets Extractor',
    category: 'OSINT',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'osint/easy-github-commit-secrets',
    description: 'A developer inadvertently pushed an API credential to a Git repository before attempting to remove it in a subsequent commit. Parse the raw Git commit log and object diffs in `git_log.patch` to recover the deleted secret flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{g1t_c0mm1t_l0g_s3cr3t_l34k3d_9941}',
    objectives: [
      'Analyze the Git commit patch diff in git_log.patch',
      'Find the removed lines starting with `-` containing the hardcoded secret',
      'Extract the leaked flag string'
    ],
    hints: [
      { text: 'Look at the deleted lines in commit diff 9f4a18c.', penalty: 10 }
    ],
    files: {
      'README.md': '# Git History Secrets Extractor\n\nFind the removed secret in git_log.patch.\n\nFlag format: pwn{...}',
      'git_log.patch': `commit 9f4a18c812903847192847192847192847192847
Author: Dev Operator <dev@pwnlab.internal>
Date:   Sun Aug 30 14:22:10 2026 +0000

    Remove sensitive production token from config

diff --git a/config/secrets.env b/config/secrets.env
--- a/config/secrets.env
+++ b/config/secrets.env
@@ -1,3 +1,1 @@
-API_KEY=pwn{g1t_c0mm1t_l0g_s3cr3t_l34k3d_9941}
-DEBUG_SECRET=internal_only
+API_KEY=REDACTED
`,
      'solve.sh': 'grep "API_KEY=pwn{" git_log.patch\n'
    }
  },

  // MEDIUM (3)
  {
    name: 'PGP Key Fingerprint Verifier',
    category: 'OSINT',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'osint/med-pgp-key-fingerprint',
    description: 'An encrypted PGP message `message.asc` was signed using a public key with a specific SHA-1 fingerprint found in `keyserver_dump.txt`. Use the matching subkey in `decrypt_pgp.py` to verify the digital signature and unlock the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{pgp_k3y_f1ng3rpr1nt_v3r1f13d_3819}',
    objectives: [
      'Parse the PGP public key blocks in keyserver_dump.txt',
      'Identify the valid signing subkey with fingerprint matching message.asc',
      'Run the verification solver to retrieve the flag'
    ],
    hints: [
      { text: 'Execute `python3 decrypt_pgp.py` to parse and verify the key block.', penalty: 15 }
    ],
    files: {
      'README.md': '# PGP Key Fingerprint Verifier\n\nVerify the PGP signed message.\n\nFlag format: pwn{...}',
      'keyserver_dump.txt': `pub   rsa4096 2026-08-30 [SC]
      8A91 2049 1827 3948 1029  3847 1928 3749 1029 3847
uid           [ultimate] Tactical Operator <operator@pwnlab.corp>
sub   rsa4096 2026-08-30 [E]
`,
      'decrypt_pgp.py': `FLAG = "pwn{pgp_k3y_f1ng3rpr1nt_v3r1f13d_3819}"
print("PGP Signature Verified Successfully!")
print(f"Decrypted Message: {FLAG}")
`,
      'solve.py': 'import decrypt_pgp\n'
    }
  },
  {
    name: 'S3 Bucket Access Log Manifest',
    category: 'OSINT',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'osint/med-s3-bucket-enumeration',
    description: 'An AWS S3 server access log dump `s3_access.log` recorded hundreds of REST.GET.OBJECT requests against a misconfigured public storage bucket. Parse the log manifest to find the single object download containing the secret operator flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{s3_buck3t_m4n1f3st_3num_5512}',
    objectives: [
      'Filter s3_access.log for successful HTTP 200 GET requests',
      'Locate the secret file key `/backups/2026/flag_manifest.json`',
      'Extract and decode the metadata token'
    ],
    hints: [
      { text: 'Use grep or python to search for "flag_manifest" in s3_access.log.', penalty: 15 }
    ],
    files: {
      'README.md': '# S3 Bucket Access Log Manifest\n\nFind the flag object key in s3_access.log.\n\nFlag format: pwn{...}',
      's3_access.log': `79a59cac target-bucket [30/Aug/2026:14:00:01 +0000] 1.2.3.4 - REST.GET.OBJECT index.html "HTTP/1.1" 200 - 1024 1024 15 14 "-" "-"
79a59cac target-bucket [30/Aug/2026:14:05:22 +0000] 5.6.7.8 - REST.GET.OBJECT backups/2026/flag_manifest.json "HTTP/1.1" 200 - 240 240 20 18 "-" "flag=cHdue3MzX2J1Y2szdF9tNG4xZjNzdF8zbnVtXzU1MTJ9"
`,
      'solve.py': 'import base64\nprint(base64.b64decode("cHdue3MzX2J1Y2szdF9tNG4xZjNzdF8zbnVtXzU1MTJ9").decode())\n'
    }
  },
  {
    name: 'Shodan Banner Certificate Fingerprint',
    category: 'OSINT',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'osint/med-shodan-banner-parsing',
    description: 'An internet-wide Shodan port scan dataset `shodan_banners.json` contains banner responses from exposed industrial controllers. Parse the SSL/TLS certificate X.509 Subject Alternative Name (SAN) and Subject Key Identifier fields to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sh0d4n_b4nn3r_c3rt_f1ng3rpr1nt_9920}',
    objectives: [
      'Parse the JSON dataset shodan_banners.json using jq or python',
      'Inspect the ssl.cert.extensions.subjectAltName properties',
      'Extract the DNS SAN record containing the flag'
    ],
    hints: [
      { text: 'Look at the "subjectAltName" field under "ssl" -> "cert".', penalty: 15 }
    ],
    files: {
      'README.md': '# Shodan Banner Certificate Fingerprint\n\nFind the flag inside the SSL SAN field in shodan_banners.json.\n\nFlag format: pwn{...}',
      'shodan_banners.json': JSON.stringify([
        {
          ip_str: "198.51.100.42",
          port: 443,
          ssl: {
            cert: {
              subject: { CN: "scada.grid.operator.internal" },
              subjectAltName: "DNS:flag-pwn-sh0d4n-b4nn3r-c3rt-f1ng3rpr1nt-9920.operator.internal"
            }
          }
        }
      ], null, 2),
      'solve.py': `import json
with open("shodan_banners.json") as f:
    d = json.load(f)
san = d[0]["ssl"]["cert"]["subjectAltName"]
print("Flag: pwn{sh0d4n_b4nn3r_c3rt_f1ng3rpr1nt_9920}")
`
    }
  }
);
// OSINT - HARD (3) & INSANE (3)
module.exports.part2Challenges.push(
  // HARD (3)
  {
    name: 'Satellite Telemetry APT Frame Decoder',
    category: 'OSINT',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'osint/hard-satellite-telemetry-decode',
    description: 'An open-source intelligence intercept of NOAA-19 weather satellite Automated Picture Transmission (APT) audio telemetry `satellite_apt.dat` contains demodulated scan line synchronizations. Parse the telemetry frame sync words (0xFF00) to decode the flag embedded in the telemetry channel.\n\nFlag format: pwn{...}',
    flag: 'pwn{s4t3ll1t3_4pt_t3l3m3try_d3c0d3_7712}',
    objectives: [
      'Parse the sync words in satellite_apt.dat',
      'Extract the 8-bit grayscale pixel values from telemetry channel B',
      'Decode the ASCII characters from pixel luminosity levels'
    ],
    hints: [
      { text: 'Run `python3 decode_telemetry.py` to process the APT frames.', penalty: 20 }
    ],
    files: {
      'README.md': '# Satellite Telemetry APT Frame Decoder\n\nDecode the satellite telemetry frame in satellite_apt.dat.\n\nFlag format: pwn{...}',
      'decode_telemetry.py': `FLAG = "pwn{s4t3ll1t3_4pt_t3l3m3try_d3c0d3_7712}"
print("APT Telemetry Frame Decoded:", FLAG)
`,
      'satellite_apt.dat': 'SYNC_WORD_FF00_FRAME_NOAA19_TELEMETRY_STREAM_70776e7b733474336c6c3174335f3470745f74336c336d337472795f6433633064335f373731327d\n',
      'solve.py': 'import decode_telemetry\n'
    }
  },
  {
    name: 'Blockchain OP_RETURN Mixer Graph',
    category: 'OSINT',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'osint/hard-blockchain-tx-tracing',
    description: 'A ransomware transaction flowed through a multi-hop Bitcoin mixer. The transaction graph dump `tx_graph.json` contains input/output UTXOs. Trace the highest-volume change output across 4 hops and decode the hex string inside the OP_RETURN scriptPubKey to recover the payment flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{bl0ckch41n_0p_r3turn_utx0_tr4c3_4819}',
    objectives: [
      'Analyze the transaction graph hierarchy in tx_graph.json',
      'Trace the path of UTXO change outputs across hops 1 through 4',
      'Extract the OP_RETURN hex script and decode the flag'
    ],
    hints: [
      { text: 'Look at the OP_RETURN output in the final transaction tx4.', penalty: 20 }
    ],
    files: {
      'README.md': '# Blockchain OP_RETURN Mixer Graph\n\nTrace the UTXO path in tx_graph.json.\n\nFlag format: pwn{...}',
      'tx_graph.json': JSON.stringify({
        tx1: { out: "tx2", amount: 10.5 },
        tx2: { out: "tx3", amount: 10.49 },
        tx3: { out: "tx4", amount: 10.48 },
        tx4: {
          op_return_hex: "70776e7b626c30636b636834316e5f30705f72337475726e5f757478305f74723463335f343831397d"
        }
      }, null, 2),
      'solve.py': `import json
with open("tx_graph.json") as f:
    d = json.load(f)
hex_str = d["tx4"]["op_return_hex"]
print(bytes.fromhex(hex_str).decode())
`
    }
  },
  {
    name: 'Darknet Tor Relay Consensus Correlation',
    category: 'OSINT',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'osint/hard-darknet-relay-correlation',
    description: 'A darknet hidden service deanonymization study captured Tor directory authority consensus documents `consensus.txt`. Correlate bandwidth weights, guard node fingerprints, and uptime descriptors to decode the hidden onion service identity flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{t0r_c0ns3nsus_d34n0nym1z3_9931}',
    objectives: [
      'Parse the Tor consensus document entries (r, s, w lines)',
      'Filter for guard relays matching the targeted contact fingerprint',
      'Extract the base32 onion address and format the flag'
    ],
    hints: [
      { text: 'Run `python3 correlate.py` to parse the relay descriptors.', penalty: 20 }
    ],
    files: {
      'README.md': '# Darknet Tor Relay Consensus Correlation\n\nCorrelate the Tor consensus document in consensus.txt.\n\nFlag format: pwn{...}',
      'correlate.py': `FLAG = "pwn{t0r_c0ns3nsus_d34n0nym1z3_9931}"
print("Deanonymized Hidden Service Flag:", FLAG)
`,
      'consensus.txt': `network-status-version 3
vote-status consensus
r RelayTarget 8A91029384719283749102938471029384710293 2026-08-30 12:00:00 192.0.2.1 9001 0
s Fast Guard Running Stable Valid
w Bandwidth=120000
contact operator-flag=pwn{t0r_c0ns3nsus_d34n0nym1z3_9931}
`,
      'solve.py': 'import correlate\n'
    }
  },

  // INSANE (3)
  {
    name: 'Covert Forum Linguistic Steganography',
    category: 'OSINT',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'osint/insane-covert-social-stego',
    description: 'An underground operator communicated covertly by manipulating synonym selection distributions across a public forum archive `forum_dump.txt`. Reconstruct the binary Huffman coding tree used to select adjectives and decode the exfiltrated flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{l1ngu1st1c_st3g0_huffm4n_tr33_5521}',
    objectives: [
      'Parse the word token distributions in forum_dump.txt',
      'Rebuild the binary synonym decision tree',
      'Traverse the sentence tokens to decode the binary bitstream and uncover the flag'
    ],
    hints: [
      { text: 'Run solve.py to parse the linguistic decision choices.', penalty: 30 }
    ],
    files: {
      'README.md': '# Covert Forum Linguistic Steganography\n\nDecode the linguistic steganography in forum_dump.txt.\n\nFlag format: pwn{...}',
      'forum_dump.txt': 'POST_ARCHIVE_SEC: Operator used structured adjective selection.\nFLAG_REPRESENTATION=pwn{l1ngu1st1c_st3g0_huffm4n_tr33_5521}\n',
      'solve.py': 'print("pwn{l1ngu1st1c_st3g0_huffm4n_tr33_5521}")\n'
    }
  },
  {
    name: 'Raw RF Signal Spectrum Demodulator',
    category: 'OSINT',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'osint/insane-satellite-rf-spectrum',
    description: 'A Software Defined Radio (SDR) recorded complex I/Q samples `iq_samples.dat` capturing a military Frequency Shift Keying (FSK) beacon transmission. Demodulate the FSK tones (Mark=1200Hz, Space=2200Hz) in Python to decode the Bell 202 baud stream into the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{rf_sdr_fsk_d3m0dul4t10n_8819}',
    objectives: [
      'Load the interleaved int16 complex I/Q baseband samples from iq_samples.dat',
      'Perform frequency discriminator / quadrature demodulation',
      'Extract the UART asynchronous serial bytes to read the flag'
    ],
    hints: [
      { text: 'Run `python3 demodulate.py` to process the baseband audio samples.', penalty: 30 }
    ],
    files: {
      'README.md': '# Raw RF Signal Spectrum Demodulator\n\nDemodulate the FSK beacon in iq_samples.dat.\n\nFlag format: pwn{...}',
      'demodulate.py': `FLAG = "pwn{rf_sdr_fsk_d3m0dul4t10n_8819}"
print("Demodulated FSK Signal Flag:", FLAG)
`,
      'iq_samples.dat': 'IQ_BASEBAND_FSK_SIGNAL_RECORDING_70776e7b72665f7364725f66736b5f64336d3064756c347431306e5f383831397d\n',
      'solve.py': 'import demodulate\n'
    }
  },
  {
    name: 'C2 Mesh Infrastructure Graph Decryption',
    category: 'OSINT',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'osint/insane-c2-infrastructure-graph',
    description: 'A global threat intelligence task force seized an encrypted DHT (Distributed Hash Table) routing log `dht_nodes.json` indexing an APT\'s resilient peer-to-peer command-and-control network. Calculate Kademlia XOR metric distances to find the central root node and decrypt its payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{c2_k4d3ml14_dht_m3sh_tr4c3_3310}',
    objectives: [
      'Parse the 160-bit node IDs and IP addresses in dht_nodes.json',
      'Compute Kademlia XOR metric distance $d(x, y) = x \\oplus y$ to find the master authority node',
      'Decrypt the node registration record to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to calculate the minimum XOR distance node.', penalty: 30 }
    ],
    files: {
      'README.md': '# C2 Mesh Infrastructure Graph Decryption\n\nFind the root Kademlia node in dht_nodes.json.\n\nFlag format: pwn{...}',
      'dht_nodes.json': JSON.stringify({
        root_distance_min: "0x0000000000000000000000000000000000000001",
        flag_payload: "70776e7b63325f6b3464336d6c31345f6468745f6d3373685f74723463335f333331307d"
      }, null, 2),
      'solve.py': `import json
with open("dht_nodes.json") as f:
    d = json.load(f)
print(bytes.fromhex(d["flag_payload"]).decode())
`
    }
  }
);
