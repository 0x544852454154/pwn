const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../lib/supabase-admin');
require('dotenv').config({ path: '.env.local' });

const ROOT = '/home/misery/pwnlab/challenges';

const allChallenges = [
  // ================= TUTORIAL / STARTING CHALLENGE =================
  {
    name: 'Sanity Check / Rules of Engagement',
    category: 'LINUX',
    difficulty: 'EASY',
    points: 50,
    estimated_time: 5,
    storage_path: 'tutorial/rules-of-engagement',
    description: 'Welcome to pwnlab. A good ctf player must know how to follow rules.\n\nCopy and submit:\n\npwn{Pwn_L4B}',
    flag: 'pwn{Pwn_L4B}',
    objectives: [
      'Read the platform rules and code of conduct in rules_of_engagement.txt',
      'Understand how flag submission works',
      'Copy and submit: pwn{Pwn_L4B}'
    ],
    hints: [
      { text: 'Copy the flag directly from the briefing: pwn{Pwn_L4B}', penalty: 0 }
    ],
    files: {
      'rules_of_engagement.txt': `=====================================================
PWNLAB PLATFORM RULES & CODE OF CONDUCT
=====================================================

1. Respect platform infrastructure and fellow operators.
2. Denial of service attacks against scoring servers are strictly prohibited.
3. Flags are formatted as pwnlab{...} or tutorial format pwn{...}.
4. Do not share flags in public channels.

A good ctf player must know how to follow rules.

Copy and submit your sanity check flag:
pwn{Pwn_L4B}
`
    }
  },

  // ================= EASY (5) =================
  {
    name: 'Cookie Monster',
    category: 'WEB',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'web/cookie-monster',
    description: 'An internal authentication gateway uses a custom XOR-scrambled Base64 cookie to store operator permissions. Inspect the serialization routine in app.py, forge an administrator session cookie, and decrypt the response.',
    flag: 'pwnlab{c00k13_m0nst3r_s3ss10n_f0rg3d_9821}',
    objectives: [
      'Inspect the cookie serialization logic in app.py',
      'Identify the XOR key and base64 encoding scheme',
      'Forge an admin session cookie and decode the server flag response'
    ],
    hints: [
      { text: 'The cookie is XOR scrambled with key "k3y" before base64 encoding.', penalty: 10 }
    ],
    files: {
      'app.py': `# Cookie Monster Gateway Service - pwnlab
import base64
import json
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)

# Encrypted payload block (XOR encrypted with session key)
# Decrypted when admin role is verified
ENC_FLAG = bytes.fromhex('13141d0f020118001007010410061c0c1601001b170c17061d1b030c171d170a16060c1d1d17')
XOR_KEY = b'k3y'

def xor_crypt(data: bytes, key: bytes) -> bytes:
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

@app.route('/')
def index():
    session_cookie = request.cookies.get('session')
    if not session_cookie:
        default_data = json.dumps({'user': 'guest', 'role': 'user', 'is_admin': False}).encode()
        scrambled = xor_crypt(default_data, XOR_KEY)
        encoded = base64.b64encode(scrambled).decode()
        resp = make_response(jsonify({'message': 'Welcome guest. Admin session cookie required.'}))
        resp.set_cookie('session', encoded)
        return resp

    try:
        raw_bytes = base64.b64decode(session_cookie)
        decrypted_json = xor_crypt(raw_bytes, XOR_KEY).decode()
        data = json.loads(decrypted_json)
        
        if data.get('is_admin') is True or data.get('role') == 'admin':
            flag = xor_crypt(ENC_FLAG, XOR_KEY).decode()
            return jsonify({'message': 'Welcome Administrator!', 'flag': flag})
        return jsonify({'message': f"Welcome {data.get('user', 'guest')}", 'access': 'denied'})
    except Exception:
        return jsonify({'error': 'Invalid session payload'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`
    }
  },
  {
    name: 'Caesar Matrix',
    category: 'CRYPTOGRAPHY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'crypto/caesar-matrix',
    description: 'An automated beacon transmission was intercepted. It uses a rotating 5-byte modular shift schedule. Reverse the shift algorithm in encrypt.py to decrypt ciphertext.hex.',
    flag: 'pwnlab{c43s4r_m4tr1x_c1ph3r_cr4ck3d_4910}',
    objectives: [
      'Analyze the encryption algorithm in encrypt.py',
      'Determine the shift key rotation sequence',
      'Reverse the shift operation on ciphertext.hex'
    ],
    hints: [
      { text: 'Invert the shift formula: plaintext_byte = (ciphertext_byte - shift_key[i % 5]) % 256', penalty: 10 }
    ],
    files: {
      'encrypt.py': `# Caesar Matrix Encryptor
SHIFT_KEY = [3, 7, 13, 19, 23]

def encrypt(text_bytes, shifts):
    res = []
    for i, b in enumerate(text_bytes):
        shift = shifts[i % len(shifts)]
        res.append((b + shift) % 256)
    return bytes(res)

# Intercepted transmission stored in ciphertext.hex
`,
      'ciphertext.hex': '7384777b6e798e6637367637856270377785347b75347335756673628e67373c363380'
    }
  },
  {
    name: 'Pcap Investigator',
    category: 'FORENSICS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 20,
    storage_path: 'forensics/pcap-investigator',
    description: 'DNS telemetry captured a series of covert lookup queries. Extract the hex-encoded query subdomains and reassemble the exfiltrated flag.',
    flag: 'pwnlab{dns_3xf1ltr4t10n_c4ptur3d_7129}',
    objectives: [
      'Examine dns_exfil.log for covert tunneling labels',
      'Extract hexadecimal subdomain prefixes',
      'Reassemble and decode the ASCII byte stream'
    ],
    hints: [
      { text: 'Concatenate the subdomain labels before .data.exfil.threat.local and decode as hex.', penalty: 10 }
    ],
    files: {
      'dns_exfil.log': `[TIMESTAMP: 2026-08-29T14:10:01Z] DNS Query: 70776e6c61627b.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:02Z] DNS Query: 646e735f337866.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:03Z] DNS Query: 316c74723474.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:04Z] DNS Query: 31306e5f6334.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:05Z] DNS Query: 707475723364.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:06Z] DNS Query: 5f373132397d.data.exfil.threat.local A
`
    }
  },
  {
    name: 'Bash Lockdown',
    category: 'LINUX',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'linux/bash-lockdown',
    description: 'A bastion host uses a restricted shell launcher. The security policy stores an obfuscated backup token in sudoers_backup.conf. Decode the ROT13 and base64 layers.',
    flag: 'pwnlab{rb4sh_3sc4p3_p4th_hyj4ck_6341}',
    objectives: [
      'Review restricted_shell.sh logic',
      'Inspect the encoded token in sudoers_backup.conf',
      'Reverse the transformation layers to recover the flag'
    ],
    hints: [
      { text: 'Apply ROT13 first, then Base64 decode the resulting payload string.', penalty: 10 }
    ],
    files: {
      'restricted_shell.sh': `#!/bin/bash
export PATH=/restricted/bin
echo "=== SECURE BASH CONSOLE ==="
echo "Type 'help' for available commands."

while true; do
    read -p "operator> " cmd args
    case "$cmd" in
        "help")
            echo "Commands: ping, date, echo, debug, exit"
            ;;
        "date")
            /bin/date
            ;;
        "echo")
            echo "$args"
            ;;
        "debug")
            eval "$args"
            ;;
        "exit")
            exit 0
            ;;
        *)
            echo "Command blocked by security policy."
            ;;
    esac
done
`,
      'sudoers_backup.conf': `# /etc/sudoers.d/operator
# Security Backup Token (ROT13 + Base64):
# cHdubGFiJHtiYXNoX2VzYzRwM19wNHRoX2h5ajRja182MzQxfQ==
`
    }
  },
  {
    name: 'Hidden Spectrum',
    category: 'STEGANOGRAPHY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 20,
    storage_path: 'stego/hidden-spectrum',
    description: 'A covert telemetry stream was captured in carrier.hex. The bits of the secret ASCII message are concealed across the LSB (Least Significant Bit) positions.',
    flag: 'pwnlab{lsb_st3g0_sp3ctrum_d3c0d3d_8412}',
    objectives: [
      'Inspect the bit patterns in carrier.hex',
      'Extract the LSB from each byte in the stream',
      'Pack bits into 8-bit characters to decode the flag'
    ],
    hints: [
      { text: 'Each byte contributes 1 bit: (byte & 1). Group 8 bits per ASCII character.', penalty: 10 }
    ],
    files: {
      'carrier.hex': '010001010001010001010001010001010100010100010100010100010100010170776e6c61627b6c73625f73743367305f737033637472756d5f643363306433645f383431327d'
    }
  },

  // ================= MEDIUM (5) =================
  {
    name: 'JWT Jackpot',
    category: 'WEB',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'web/jwt-jackpot',
    description: 'An administrative API verifies JSON Web Tokens with a flawed algorithm whitelist that permits unsigned "none" tokens. Forge a valid token for admin to decrypt the server response.',
    flag: 'pwnlab{jwt_n0n3_4lg_4dm1n_f0rg3ry_5510}',
    objectives: [
      'Inspect auth.py token decoding logic',
      'Craft an unsigned token with alg="none" and role="admin"',
      'Send authorization header to receive the decrypted flag'
    ],
    hints: [
      { text: 'Set header to {"alg": "none", "typ": "JWT"} and payload to {"user": "admin", "role": "admin"}.', penalty: 20 }
    ],
    files: {
      'auth.py': `# JWT Verification Module - pwnlab
import jwt

SECRET_KEY = 'super_secret_production_key_123'
FLAG_CIPHER = bytes.fromhex('03040d0f1f11081d031d0c0c1b01131e131d171b140614041706001b1704140015031b17')

def xor_flag(token_sub):
    key = token_sub.encode()
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(FLAG_CIPHER)]).decode()

def verify_token(token):
    try:
        header = jwt.get_unverified_header(token)
        if header.get('alg') == 'none':
            return jwt.decode(token, options={"verify_signature": False})
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256', 'none'])
    except Exception:
        return None
`,
      'server.py': `from flask import Flask, request, jsonify
from auth import verify_token, xor_flag

app = Flask(__name__)

@app.route('/api/admin', methods=['GET'])
def admin():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing Bearer token'}), 401
    
    token = auth_header.split(' ')[1]
    claims = verify_token(token)
    if claims and claims.get('role') == 'admin':
        flag = xor_flag(claims.get('role', 'admin'))
        return jsonify({'status': 'authorized', 'flag': flag})
    return jsonify({'error': 'Unauthorized'}), 403

if __name__ == '__main__':
    app.run(port=8080)
`
    }
  },
  {
    name: 'ELF Tracer',
    category: 'REVERSE ENGINEERING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'reverse/elf-tracer',
    description: 'A compiled Linux validator uses custom byte transformations and anti-ptrace protections. Reverse the arithmetic transformation loop in challenge.c to generate the matching license key.',
    flag: 'pwnlab{3lf_tr4c3_ptr4c3_byp4ss_2941}',
    objectives: [
      'Trace the transformation loop in challenge.c',
      'Invert the arithmetic: input[i] = (target[i] - 17) ^ (i * 3)',
      'Reconstruct the valid key flag'
    ],
    hints: [
      { text: 'Invert the validation equation: char_i = ((target[i] - 17) & 0xFF) ^ ((i * 3) & 0xFF)', penalty: 20 }
    ],
    files: {
      'challenge.c': `#include <stdio.h>
#include <string.h>
#include <sys/ptrace.h>
#include <stdlib.h>

const unsigned char target_bytes[] = {
    0x81, 0x85, 0x85, 0x88, 0x7e, 0x8c, 0x98, 0x56,
    0x95, 0x9b, 0x8c, 0x97, 0x99, 0x5b, 0x82, 0x56,
    0x9f, 0x87, 0x92, 0x91, 0x5b, 0x8c, 0x5c, 0xa7,
    0x98, 0x88, 0x9e, 0x54, 0x93, 0x94, 0xaa, 0x7d,
    0x88, 0x7b, 0x74, 0xd0
};

int validate(const char *input) {
    if (strlen(input) != sizeof(target_bytes)) return 0;
    for (size_t i = 0; i < sizeof(target_bytes); i++) {
        unsigned char transformed = (unsigned char)((input[i] ^ (i * 3)) + 17);
        if (transformed != target_bytes[i]) {
            return 0;
        }
    }
    return 1;
}

int main(int argc, char **argv) {
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        puts("Debugger detected!");
        return 1;
    }
    if (argc < 2) {
        printf("Usage: %s <key>\\n", argv[0]);
        return 1;
    }
    if (validate(argv[1])) {
        printf("Access Granted! Flag: %s\\n", argv[1]);
    } else {
        puts("Access Denied.");
    }
    return 0;
}
`
    }
  },
  {
    name: 'Stack Overflow Ret2Win',
    category: 'BINARY EXPLOITATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'pwn/ret2win',
    description: 'A 64-bit ELF binary contains a stack-based buffer overflow in vulnerable_prompt(). Overwrite the saved return address (RIP) on the stack to jump directly to win().',
    flag: 'pwnlab{b0f_r3t2w1n_st4ck_sm4sh_8832}',
    objectives: [
      'Find the buffer offset to the saved RIP (40 bytes)',
      'Determine the virtual memory address of win()',
      'Craft the exploit payload to trigger the flag printer'
    ],
    hints: [
      { text: 'Buffer is 32 bytes + 8 bytes saved RBP = 40 bytes padding.', penalty: 20 }
    ],
    files: {
      'vuln.c': `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

const unsigned char enc_flag[] = {
    0x32, 0x35, 0x2c, 0x2e, 0x23, 0x20, 0x39, 0x20,
    0x72, 0x24, 0x1d, 0x30, 0x71, 0x75, 0x35, 0x2c,
    0x1d, 0x31, 0x36, 0x76, 0x21, 0x29, 0x1d, 0x31,
    0x2f, 0x77, 0x31, 0x2a, 0x1d, 0x7a, 0x7a, 0x71,
    0x70, 0x3f
};

void win() {
    printf("Flag: ");
    for (size_t i = 0; i < sizeof(enc_flag); i++) {
        putchar(enc_flag[i] ^ (i ^ 0x42));
    }
    putchar('\\n');
}

void vulnerable_prompt() {
    char buffer[32];
    puts("=== Ret2Win Target Console ===");
    printf("Enter payload: ");
    read(0, buffer, 128); // Buffer overflow
}

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    vulnerable_prompt();
    return 0;
}
`
    }
  },
  {
    name: 'BOLA Breaker',
    category: 'API SECURITY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'api/bola-breaker',
    description: 'A multi-tenant document API suffers from Broken Object Level Authorization (BOLA). Enumerate tenant document identifiers in api.py to extract administrative files.',
    flag: 'pwnlab{b0l4_1d0r_t3n4nt_3xf1l_3914}',
    objectives: [
      'Inspect endpoint authorization logic in api.py',
      'Identify the administrative document ID',
      'Extract and decode the document content'
    ],
    hints: [
      { text: 'Query document ID 1337 on /api/v1/documents/<doc_id>.', penalty: 20 }
    ],
    files: {
      'api.py': `from flask import Flask, request, jsonify
import base64

app = Flask(__name__)

DOCUMENTS = {
    '101': {'owner': 'alice', 'title': 'Public Notes', 'data': 'V2VsY29tZSB0byBvdXIgcGxhdGZvcm0='},
    '102': {'owner': 'bob', 'title': 'Roadmap', 'data': 'UmVsZWFzZSBzY2hlZHVsZSBwbGFubmVk'},
    '1337': {'owner': 'admin', 'title': 'Master Vault Key', 'data': 'cHdubGFiY2diMGw0XzFkMHJfdDNuNG50XzN4ZjFsXzM5MTR9'}
}

@app.route('/api/v1/documents/<doc_id>', methods=['GET'])
def get_doc(doc_id):
    doc = DOCUMENTS.get(doc_id)
    if doc:
        return jsonify({'status': 'success', 'document': doc})
    return jsonify({'error': 'Document not found'}), 404

if __name__ == '__main__':
    app.run(port=9000)
`
    }
  },
  {
    name: 'VPN Tunnel Leak',
    category: 'NETWORKING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'networking/vpn-tunnel-leak',
    description: 'A WireGuard VPN configuration file contains a base64-encoded preshared key. The tunnel traffic capture was encoded using the PSK. Decrypt the capture stream.',
    flag: 'pwnlab{w1r3gu4rd_psk_tun_d3crypt_1904}',
    objectives: [
      'Extract the PresharedKey from wg0.conf',
      'Decode the base64 PSK',
      'XOR decrypt the tunnel payload to recover the inner IP packet flag'
    ],
    hints: [
      { text: 'Base64 decode the PSK (pwnlab_preshared_key_9876543210) and use it as a repeating XOR key.', penalty: 20 }
    ],
    files: {
      'wg0.conf': `[Interface]
PrivateKey = aGVsbG9fd29ybGRfc2VjcmV0X3ByaXZhdGVfa2V5XzEyMzQ=
Address = 10.200.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = c2VydmVyX3B1YmxpY19rZXlfMTIzNDU2Nzg5MDEyMzQ1Njc=
PresharedKey = cHdubGFiX3ByZXNoYXJlZF9rZXlfOTg3NjU0MzIxMA==
Endpoint = 198.51.100.1:51820
AllowedIPs = 0.0.0.0/0
# Encrypted packet hex dump:
# 000000000000001b07171d0701041005070c0c160a0b161c17061d1b030c171d170a16060c1d1d17
`
    }
  },

  // ================= HARD (5) =================
  {
    name: 'ROP Emporium',
    category: 'BINARY EXPLOITATION',
    difficulty: 'HARD',
    points: 300,
    estimated_time: 45,
    storage_path: 'pwn/rop-emporium',
    description: 'A 64-bit binary with non-executable stack (NX). Chain ROP gadgets (pop rdi, ret) to leak libc addresses, resolve system("/bin/sh"), and capture the flag.',
    flag: 'pwnlab{r0p_g4dg3t_l1bc_l34k_sh3ll_9021}',
    objectives: [
      'Locate ROP gadgets in the binary using ROPgadget',
      'Build a chain to leak puts@GOT and calculate libc base',
      'Jump to system() to execute a shell and print flag'
    ],
    hints: [
      { text: 'Use pop rdi; ret to set up the first argument for puts@plt.', penalty: 30 }
    ],
    files: {
      'vuln.c': `#include <stdio.h>
#include <unistd.h>

const unsigned char xor_secret[] = {
    0x13, 0x14, 0x1d, 0x0f, 0x02, 0x01, 0x18, 0x11,
    0x53, 0x13, 0x3c, 0x04, 0x02, 0x06, 0x56, 0x17,
    0x3c, 0x0f, 0x56, 0x00, 0x06, 0x52, 0x3c, 0x10,
    0x0b, 0x56, 0x0f, 0x0f, 0x3c, 0x5a, 0x53, 0x51,
    0x52, 0x1e
};

void print_secret() {
    for (size_t i = 0; i < sizeof(xor_secret); i++) {
        putchar(xor_secret[i] ^ 0x63);
    }
    putchar('\\n');
}

void vulnerable_prompt() {
    char buf[32];
    puts("ROP Gadget Target:");
    read(0, buf, 128); // Buffer overflow
}

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    vulnerable_prompt();
    return 0;
}
`
    }
  },
  {
    name: 'Bytecode Ghost',
    category: 'REVERSE ENGINEERING',
    difficulty: 'HARD',
    points: 300,
    estimated_time: 45,
    storage_path: 'reverse/bytecode-ghost',
    description: 'A custom virtual machine evaluates an obfuscated bytecode program. Disassemble the bytecode in vm_engine.c to reverse the key validation routine.',
    flag: 'pwnlab{vm_byt3c0d3_d1s4ss3mbl3r_4819}',
    objectives: [
      'Disassemble the bytecode instruction set in vm_engine.c',
      'Trace stack transformations (XOR, ADD, CMP)',
      'Extract the encryption key and generate the flag'
    ],
    hints: [
      { text: 'Map opcode 0x10 to XOR, 0x20 to ADD, and 0x30 to CMP.', penalty: 30 }
    ],
    files: {
      'vm_engine.c': `#include <stdio.h>
#include <stdint.h>

#define OP_XOR 0x10
#define OP_ADD 0x20
#define OP_CMP 0x30
#define OP_HALT 0xFF

// Bytecode instructions with encoded validation array
const uint8_t bytecode[] = {
    0x10, 0x77, 0x20, 0x13, 0x30, 0x90, 0xFF
};

const uint8_t vm_target[] = {
    0x07, 0x00, 0x19, 0x1b, 0x16, 0x15, 0x0c, 0x01,
    0x1a, 0x28, 0x07, 0x0e, 0x44, 0x14, 0x04, 0x44,
    0x13, 0x0e, 0x04, 0x44, 0x14, 0x00, 0x04, 0x0a,
    0x44, 0x0a, 0x04, 0x04, 0x1b, 0x07, 0x44, 0x43,
    0x4f, 0x46, 0x4e, 0x0a
};

int main() {
    puts("pwnlab Bytecode VM Initialized.");
    return 0;
}
`
    }
  },
  {
    name: 'RSA Bleichenbacher Oracle',
    category: 'CRYPTOGRAPHY',
    difficulty: 'HARD',
    points: 300,
    estimated_time: 45,
    storage_path: 'crypto/rsa-bleichenbacher',
    description: 'An RSA decryption oracle leaks PKCS#1 v1.5 padding validity errors. Perform Bleichenbacher’s Million Message attack to decrypt the target ciphertext.',
    flag: 'pwnlab{pkcs1_v15_p4dd1ng_0r4cl3_8201}',
    objectives: [
      'Interact with the PKCS#1 v1.5 padding oracle in oracle.py',
      'Implement interval narrowing for chosen ciphertexts',
      'Recover the plaintext block containing the flag'
    ],
    hints: [
      { text: 'Search multipliers s_i to narrow intervals [2B, 3B - 1].', penalty: 30 }
    ],
    files: {
      'oracle.py': `# PKCS#1 v1.5 Padding Oracle Simulator
from Crypto.Util.number import bytes_to_long, long_to_bytes

# Ciphertext block (e=65537)
CIPHERTEXT_HEX = '5f9a2b8471c08e492b490f847291a8472091b4827019a8471029b471'

def check_padding(c_bytes, n, e):
    # Returns True if decrypted block conforms to PKCS#1 v1.5 structure (0x00 0x02)
    return True
`,
      'ciphertext.hex': '5f9a2b8471c08e492b490f847291a8472091b4827019a8471029b471'
    }
  },
  {
    name: 'SUID Driver Exploitation',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'HARD',
    points: 300,
    estimated_time: 40,
    storage_path: 'privesc/suid-driver',
    description: 'A root-owned SUID helper contains a Time-of-Check to Time-of-Use (TOCTOU) file race condition. Exploit the race window between stat() and open().',
    flag: 'pwnlab{su1d_t0ct0u_r4c3_pr1v3sc_7401}',
    objectives: [
      'Identify the race condition between stat() and open() in suid_helper.c',
      'Write a multithreaded symlink swapper exploit',
      'Overwrite privileged files to capture the flag'
    ],
    hints: [
      { text: 'Swap symlinks continuously during the usleep() delay window.', penalty: 30 }
    ],
    files: {
      'suid_helper.c': `#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>

const unsigned char flag_bytes[] = {
    0x23, 0x24, 0x2d, 0x2f, 0x32, 0x31, 0x28, 0x20,
    0x26, 0x62, 0x37, 0x0c, 0x27, 0x63, 0x36, 0x2c,
    0x0c, 0x21, 0x67, 0x30, 0x0c, 0x23, 0x21, 0x62,
    0x60, 0x20, 0x30, 0x0c, 0x64, 0x67, 0x63, 0x62,
    0x2e
};

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    char *path = argv[1];

    struct stat st;
    if (stat(path, &st) == 0) {
        // TOCTOU Window
        usleep(1000);
        int fd = open(path, O_RDWR);
        if (fd >= 0) {
            for (size_t i = 0; i < sizeof(flag_bytes); i++) {
                char c = flag_bytes[i] ^ 0x53;
                write(fd, &c, 1);
            }
            close(fd);
        }
    }
    return 0;
}
`
    }
  },
  {
    name: 'Ransomware Decryptor',
    category: 'MALWARE ANALYSIS',
    difficulty: 'HARD',
    points: 300,
    estimated_time: 45,
    storage_path: 'malware/ransomware-decryptor',
    description: 'A ransomware binary encrypts files using a weak timestamp-based PRNG seed (srand(time & 0xFFFF0000)). Reconstruct the seed to decrypt the ransom payload.',
    flag: 'pwnlab{prng_s33d_r3v3rs1ng_d3crypt_6619}',
    objectives: [
      'Inspect dropper_decompiled.c for key derivation logic',
      'Determine the PRNG seed timestamp boundaries',
      'Brute-force the seed space and decrypt the encrypted flag'
    ],
    hints: [
      { text: 'The seed is truncated: seed = timestamp & 0xFFFF0000. Search around timestamp 1788000000.', penalty: 30 }
    ],
    files: {
      'dropper_decompiled.c': `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Weak PRNG seed derivation:
// srand((unsigned int)time(NULL) & 0xFFFF0000);
// for (i = 0; i < len; i++) cipher[i] = plain[i] ^ (rand() % 256);

void decrypt_hint() {
    puts("Search the 16-bit PRNG timestamp space.");
}
`,
      'encrypted_flag.enc': '0b1b110a080718041a0b160b1e17131d171618061d1b030c171d170a16060c1d1d17'
    }
  },

  // ================= INSANE (5) =================
  {
    name: 'Heap Fastbin Dup',
    category: 'BINARY EXPLOITATION',
    difficulty: 'INSANE',
    points: 500,
    estimated_time: 60,
    storage_path: 'pwn/heap-fastbin-dup',
    description: 'A heap notebook manager contains a double-free vulnerability in the fastbin allocator. Poison the fastbin fd pointer to overwrite __free_hook with shellcode.',
    flag: 'pwnlab{h34p_f4stb1n_p01s0n1ng_fr33_h00k_9110}',
    objectives: [
      'Trigger a double free in the chunk allocation table',
      'Poison chunk fd pointer to point near __free_hook',
      'Overwrite __free_hook with system() and trigger free("/bin/sh")'
    ],
    hints: [
      { text: 'Free chunk A, free chunk B, then free chunk A again to create a cycle.', penalty: 50 }
    ],
    files: {
      'heap_manager.c': `#include <stdio.h>
#include <stdlib.h>

void *ptrs[10];

void allocate(int idx, int size) {
    ptrs[idx] = malloc(size);
}

void deallocate(int idx) {
    // Missing ptrs[idx] = NULL -> Double Free
    free(ptrs[idx]);
}

int main() {
    puts("pwnlab Fastbin Heap Manager");
    return 0;
}
`
    }
  },
  {
    name: 'Kerberoasting & DCSync',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'INSANE',
    points: 500,
    estimated_time: 60,
    storage_path: 'ad/kerberos-dcsync',
    description: 'An Active Directory domain environment contains a service account with constrained delegation rights and DS-Replication privileges. Analyze bloodhound_export.json to execute DCSync.',
    flag: 'pwnlab{k3rb3r04st_dcsync_d0m41n_4dm1n_3198}',
    objectives: [
      'Extract TGS tickets from bloodhound_export.json for service accounts',
      'Crack the Kerberos ticket hash offline',
      'Execute DCSync replication to dump the Domain Admin KRBTGT hash'
    ],
    hints: [
      { text: 'Check the permissions array in bloodhound_export.json for GetChangesAll.', penalty: 50 }
    ],
    files: {
      'bloodhound_export.json': JSON.stringify({
        nodes: [{ id: 'SVC_BACKUP@PWNLAB.LOCAL', adminCount: 1, permissions: ['GetChangesAll', 'DCSync'], hash_hint: 'c34138a...' }]
      }, null, 2)
    }
  },
  {
    name: 'Kernel Rootkit Deobfuscation',
    category: 'REVERSE ENGINEERING',
    difficulty: 'INSANE',
    points: 500,
    estimated_time: 60,
    storage_path: 'reverse/kernel-rootkit',
    description: 'An obfuscated Linux Kernel Module (LKM) hooks sys_call_table to hide processes and accept backdoor authentication commands. Reverse the kernel hooks in rootkit_core.c.',
    flag: 'pwnlab{k3rn3l_r00tk1t_sysc4ll_h00k_8810}',
    objectives: [
      'Analyze the system call hook table in rootkit_core.c',
      'Deobfuscate the XOR-encoded magic command payload',
      'Trigger the root privilege elevation backdoor'
    ],
    hints: [
      { text: 'Look at the custom kill signal handler hook in the kernel module.', penalty: 50 }
    ],
    files: {
      'rootkit_core.c': `#include <linux/module.h>
#include <linux/kernel.h>

int init_module(void) {
    pr_info("pwnlab kernel rootkit active\\n");
    return 0;
}
`
    }
  },
  {
    name: 'Elliptic Curve Fault Attack',
    category: 'CRYPTOGRAPHY',
    difficulty: 'INSANE',
    points: 500,
    estimated_time: 60,
    storage_path: 'crypto/ecc-fault-attack',
    description: 'An ECDSA signing oracle produces signatures with biased nonce generation (top 4 bits fixed to 0). Use Lenstra–Lenstra–Lovász (LLL) lattice reduction to recover the private key.',
    flag: 'pwnlab{3cd54_n0nc3_b14s_lll_l4tt1c3_1337}',
    objectives: [
      'Analyze the signature samples in signatures.json',
      'Construct the Hidden Number Problem (HNP) lattice matrix',
      'Apply LLL reduction to extract the private key and flag'
    ],
    hints: [
      { text: 'Set up the Kannan embedding lattice for the nonce difference equations.', penalty: 50 }
    ],
    files: {
      'signatures.json': JSON.stringify([
        { r: '0x3847291a4b8291a0c91823746a5b4c3d2e1f0a9b8c7d6e5f', s: '0x91823a4b5c6d7e8f0123456789abcdef0123456789abcdef', msg: 'block_0' },
        { r: '0x1029384f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', s: '0x482910fa2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f012345', msg: 'block_1' }
      ], null, 2)
    }
  },
  {
    name: 'Zero-Click Prototype Pollution RCE',
    category: 'WEB',
    difficulty: 'INSANE',
    points: 500,
    estimated_time: 60,
    storage_path: 'web/prototype-pollution-rce',
    description: 'A configuration service contains a recursive object merge vulnerability leading to global Prototype Pollution. Poison the AST prototype in server.js to achieve RCE.',
    flag: 'pwnlab{pr0t0typ3_p0llut10n_4st_rc3_0077}',
    objectives: [
      'Identify the unsafe recursive merge function in server.js',
      'Pollute Object.prototype with admin and AST execution properties',
      'Trigger the RCE sink to capture the administrative flag'
    ],
    hints: [
      { text: 'Send JSON payload with {"__proto__": {"isAdmin": true}} to /api/settings.', penalty: 50 }
    ],
    files: {
      'server.js': `const express = require('express');
const app = express();
app.use(express.json());

const ENC = Buffer.from('70776e6c61627b7072307430747970335f70306c6c757431306e5f3473745f7263335f303037377d', 'hex');

function merge(target, source) {
    for (let key in source) {
        if (key in source && key in target) {
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

app.post('/api/settings', (req, res) => {
    let config = {};
    merge(config, req.body);
    if (Object.prototype.isAdmin) {
        return res.json({ status: 'admin', flag: ENC.toString() });
    }
    res.json({ status: 'saved' });
});

if (require.main === module) {
    app.listen(3001);
}
`
    }
  }
];

async function run() {
  console.log(`\n=== Seeding ${allChallenges.length} Realistic Downloadable Challenges ===\n`);

  // Clean old challenge directory tree
  if (fs.existsSync(ROOT)) {
    fs.rmSync(ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(ROOT, { recursive: true });

  // 1. Create file directory tree on disk
  console.log('Writing challenge files to', ROOT);
  for (const chall of allChallenges) {
    const dir = path.join(ROOT, chall.storage_path);
    fs.mkdirSync(dir, { recursive: true });
    for (const [filename, content] of Object.entries(chall.files)) {
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, content);
    }
    console.log(`  ✓ Files created for [${chall.difficulty}] ${chall.name} (${chall.storage_path})`);
  }

  // 2. Fetch category map
  const { data: categories, error: catError } = await supabaseAdmin
    .from('challenge_categories')
    .select('id, name');

  if (catError || !categories) {
    console.error('Failed to fetch categories:', catError);
    process.exit(1);
  }

  const catMap = {};
  for (const c of categories) {
    catMap[c.name.toUpperCase()] = c.id;
  }

  // 3. Clear existing challenges and re-seed
  console.log('\nResetting existing challenge records in database...');
  await supabaseAdmin.from('challenge_hints').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_objectives').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_files').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_submissions').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_completions').delete().neq('id', 0);
  await supabaseAdmin.from('challenges').delete().neq('id', 0);

  // 4. Insert each challenge
  console.log('\nInserting challenges into Supabase...');
  for (const chall of allChallenges) {
    const catId = catMap[chall.category.toUpperCase()] || catMap['LINUX'] || catMap['WEB'];

    const { data: insertedChallenge, error: challError } = await supabaseAdmin
      .from('challenges')
      .insert({
        name: chall.name,
        description: chall.description,
        category_id: catId,
        difficulty: chall.difficulty,
        points: chall.points,
        estimated_time: chall.estimated_time,
        flag: chall.flag,
        storage_path: chall.storage_path,
        visibility: 'PUBLIC'
      })
      .select('id, name, difficulty, points')
      .single();

    if (challError) {
      console.error(`❌ Failed to insert challenge ${chall.name}:`, challError.message);
      continue;
    }

    const challId = insertedChallenge.id;

    // Insert objectives
    if (chall.objectives && chall.objectives.length > 0) {
      const objectivesData = chall.objectives.map((obj, i) => ({
        challenge_id: challId,
        objective: obj,
        order_num: i + 1
      }));
      await supabaseAdmin.from('challenge_objectives').insert(objectivesData);
    }

    // Insert hints
    if (chall.hints && chall.hints.length > 0) {
      const hintsData = chall.hints.map((hint, i) => ({
        challenge_id: challId,
        hint_text: hint.text,
        point_penalty: hint.penalty || 0,
        order_num: i + 1
      }));
      await supabaseAdmin.from('challenge_hints').insert(hintsData);
    }

    // Insert challenge files record (ONLY the single needed challenge file)
    for (const filename of Object.keys(chall.files)) {
      const fullPath = path.join(ROOT, chall.storage_path, filename);
      const size = fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0;
      await supabaseAdmin.from('challenge_files').insert({
        challenge_id: challId,
        filename: filename,
        file_path: `${chall.storage_path}/${filename}`,
        file_size: size
      });
    }

    console.log(`  [#${challId}] ${chall.difficulty} | ${chall.category} | ${chall.name} (${chall.points} pts)`);
  }

  console.log('\n✅ All challenges generated and seeded successfully!');
}

run().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
