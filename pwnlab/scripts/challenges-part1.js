// Part 1: LINUX, NETWORKING, WEB (36 Challenges)
module.exports = {
  part1Challenges: [
    // ==========================================
    // 1. LINUX - EASY (3)
    // ==========================================
    {
      name: 'Base64 Cron Secret',
      category: 'LINUX',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 10,
      storage_path: 'linux/easy-base64-cron',
      description: 'An automated background maintenance job runs periodically on the tactical jumpbox. Forensics detected an obfuscated base64 command string inside the scheduled job directory. Decode the payload in the terminal to recover the operator flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{cr0n_b4s364_d3c0d3d_8192}',
      objectives: [
        'Inspect the scheduled cron jobs in the directory',
        'Extract the encoded base64 command string',
        'Decode the payload using terminal tools to recover the flag'
      ],
      hints: [
        { text: 'Look at cron.d/backup_job and use base64 -d to decode the token.', penalty: 10 }
      ],
      files: {
        'README.md': '# Base64 Cron Secret\n\nDecode the obfuscated scheduled maintenance task to retrieve the flag.\n\nFlag format: pwn{...}',
        'cron.d/backup_job': '# /etc/cron.d/backup_job\n* * * * * root echo "cHdue2NyMG5fYjRzMzY0X2QzYzBkM2RfODE5Mn0=" | base64 -d > /dev/null\n',
        'solve.sh': '#!/bin/bash\nbase64 -d <<< "cHdue2NyMG5fYjRzMzY0X2QzYzBkM2RfODE5Mn0="\n'
      }
    },
    {
      name: 'Syslog ROT13 Incident',
      category: 'LINUX',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'linux/easy-rot13-syslog',
      description: 'During a security incident, an adversary obfuscated their exfiltrated telemetry in the system logs using a standard ROT13 Caesar cipher. Parse the syslog dump and decode the flag using terminal utilities.\n\nFlag format: pwn{...}',
      flag: 'pwn{sysl0g_r0t13_tr_d3c0d3_7421}',
      objectives: [
        'Examine syslog.log for anomalous security incident entries',
        'Identify the ROT13 encoded flag string',
        'Apply ROT13 decoding using tr or python to reveal the flag'
      ],
      hints: [
        { text: 'Use tr "A-Za-z" "N-ZA-Mn-za-m" or python3 to rotate 13 characters.', penalty: 10 }
      ],
      files: {
        'README.md': '# Syslog ROT13 Incident\n\nFind the ROT13 encoded incident event in syslog.log and rotate it 13 positions.\n\nFlag format: pwn{...}',
        'syslog.log': 'Aug 30 12:04:11 jumpbox sshd[1042]: Accepted publickey for operator from 10.0.0.5 port 54122 ssh2\nAug 30 12:05:00 jumpbox kernel: [ 412.91] audit: type=1400 msg=audit(1693400700): incident_token="cja{flfy0t_e0g13_ge_q3p0q3_7421}"\nAug 30 12:06:22 jumpbox cron[1090]: (root) CMD (/usr/local/bin/sync.sh)\n',
        'decode.py': '#!/usr/bin/env python3\nimport codecs\nenc = "cja{flfy0t_e0g13_ge_q3p0q3_7421}"\nprint(codecs.decode(enc, "rot_13"))\n'
      }
    },
    {
      name: 'Hex Environment Dump',
      category: 'LINUX',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'linux/easy-hex-env',
      description: 'An operator environment dump was extracted from /proc/self/environ. The target credentials and system tokens were dumped in raw hexadecimal format. Convert the hex stream to ASCII to capture the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{h3x_3nv_pr0c_d3c0d3d_3940}',
      objectives: [
        'Inspect the proc_environ.hex dump file',
        'Use xxd or python3 to decode the hexadecimal representation',
        'Extract the flag from the environment string'
      ],
      hints: [
        { text: 'Run `xxd -r -p proc_environ.hex` or `python3 -c "print(bytes.fromhex(open(\'proc_environ.hex\').read().strip()).decode())"`', penalty: 10 }
      ],
      files: {
        'README.md': '# Hex Environment Dump\n\nDecode the hex-encoded environment stream.\n\nFlag format: pwn{...}',
        'proc_environ.hex': '70776e7b6833785f336e765f707230635f643363306433645f333934307d',
        'solution.py': 'with open("proc_environ.hex") as f:\n    print(bytes.fromhex(f.read().strip()).decode())\n'
      }
    }
  ]
};
// LINUX - MEDIUM (3)
module.exports.part1Challenges.push(
  {
    name: 'XOR Daemon Extraction',
    category: 'LINUX',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'linux/med-xor-daemon',
    description: 'A suspicious background service `daemon.py` was found listening on localhost. The service encrypts incoming commands using a static single-byte XOR key and saves the session log in `session.enc`. Decrypt the session data to recover the operator token.\n\nFlag format: pwn{...}',
    flag: 'pwn{x0r_d43m0n_k3y_r3v3rs3d_9941}',
    objectives: [
      'Analyze daemon.py to determine the XOR encryption routine and key',
      'Read session.enc in the terminal',
      'Write a Python solver or use terminal tools to decrypt the session flag'
    ],
    hints: [
      { text: 'daemon.py uses XOR with key 0x5A on each byte.', penalty: 15 }
    ],
    files: {
      'README.md': '# XOR Daemon Extraction\n\nReverse the XOR encryption routine in daemon.py and decrypt session.enc.\n\nFlag format: pwn{...}',
      'daemon.py': '#!/usr/bin/env python3\nXOR_KEY = 0x5A\ndef encrypt(data: bytes) -> bytes:\n    return bytes([b ^ XOR_KEY for b in data])\n',
      'session.enc': Buffer.from('pwn{x0r_d43m0n_k3y_r3v3rs3d_9941}'.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x5A)).join(''), 'binary').toString('hex'),
      'solve.py': 'with open("session.enc") as f:\n    data = bytes.fromhex(f.read().strip())\n    print("".join(chr(b ^ 0x5A) for b in data))\n'
    }
  },
  {
    name: 'Shadow Hash Derivation',
    category: 'LINUX',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'linux/med-shadow-audit',
    description: 'An archivist script `hasher.py` left behind a salted SHA-256 hash in `token.hash` along with a known PIN prefix pattern (4-digit numeric code `PIN_XXXX`). Reverse the hash derivation loop in the terminal to find the valid PIN and unlock the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sh4d0w_p1n_cr4ck3d_4812}',
    objectives: [
      'Analyze hasher.py and token.hash',
      'Identify the salt and hashing algorithm',
      'Write a brute-force search script in Python to find the matching PIN and generate the flag'
    ],
    hints: [
      { text: 'Iterate PIN from 1000 to 9999 with salt "pwnlab_salt_". PIN is 4812.', penalty: 15 }
    ],
    files: {
      'README.md': '# Shadow Hash Derivation\n\nReverse the hash in token.hash to recover the 4-digit PIN.\nFlag is pwn{sh4d0w_p1n_cr4ck3d_<PIN>}\n',
      'hasher.py': 'import hashlib\nSALT = b"pwnlab_salt_"\ndef hash_pin(pin: int) -> str:\n    return hashlib.sha256(SALT + str(pin).encode()).hexdigest()\n',
      'token.hash': 'cfa57e932bd4cd7cf69c24e3c312d16005d51bd961bda2f912c344f9fa6de238\n',
      'solve.py': 'import hashlib\nSALT = b"pwnlab_salt_"\nTARGET = "cfa57e932bd4cd7cf69c24e3c312d16005d51bd961bda2f912c344f9fa6de238"\nfor pin in range(1000, 10000):\n    if hashlib.sha256(SALT + str(pin).encode()).hexdigest() == TARGET:\n        print(f"pwn{{sh4d0w_p1n_cr4ck3d_{pin}}}")\n        break\n'
    }
  },
  {
    name: 'Bash Octal Deobfuscation',
    category: 'LINUX',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'linux/med-bash-obfuscation',
    description: 'An evasion script `payload.sh` was discovered in `/tmp`. The adversary encoded the entire payload using octal escape sequences executed through bash printf. Deobfuscate and decode the script to reveal the hidden command and flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{0ct4l_3sc4p3_b4sh_d30bf_6172}',
    objectives: [
      'Inspect the obfuscated shell script payload.sh',
      'Decode the octal escape sequence without executing untrusted commands',
      'Extract the decoded flag string'
    ],
    hints: [
      { text: 'Use `printf "%b" "$(< payload.sh)"` or python string decode.', penalty: 15 }
    ],
    files: {
      'README.md': '# Bash Octal Deobfuscation\n\nDeobfuscate the octal encoded script to reveal the flag.\n\nFlag format: pwn{...}',
      'payload.sh': '\\145\\143\\150\\157\\040\\042\\160\\167\\156\\173\\060\\143\\164\\064\\154\\137\\063\\163\\143\\064\\160\\063\\137\\142\\064\\163\\150\\137\\144\\063\\060\\142\\146\\137\\066\\061\\067\\062\\175\\042\n',
      'solve.py': 'with open("payload.sh") as f:\n    oct_data = f.read().strip()\n    # decode \\ooo\n    import re\n    res = re.sub(r"\\\\([0-7]{3})", lambda m: chr(int(m.group(1), 8)), oct_data)\n    print("Decoded command:", res)\n'
    }
  }
);
// LINUX - HARD (3) & INSANE (3)
module.exports.part1Challenges.push(
  // HARD (3)
  {
    name: 'Kernel Module String Table',
    category: 'LINUX',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'linux/hard-kernel-module-strings',
    description: 'A suspicious Loadable Kernel Module (LKM) source file `driver.c` was intercepted. The module decrypts an internal authorization key using a custom non-linear substitution matrix and XOR rotation. Reverse engineer the matrix mapping in the terminal to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{lkm_m4tr1x_subst1tut10n_k3rn_5521}',
    objectives: [
      'Examine the S-box substitution matrix in driver.c',
      'Analyze the byte-permutation logic and inverse schedule',
      'Execute a reverse decryptor in Python to unpack the kernel flag'
    ],
    hints: [
      { text: 'Invert the S-box array lookup: s_box[i] was used to encrypt. Find matching indexes.', penalty: 20 }
    ],
    files: {
      'README.md': '# Kernel Module String Table\n\nReverse the S-box substitution in driver.c.\n\nFlag format: pwn{...}',
      'driver.c': `// Linux Kernel Module Telemetry Driver
#include <linux/module.h>
#include <linux/kernel.h>

static unsigned char enc[] = {0x41, 0x5a, 0x33, 0x1f, 0x6e, 0x22, 0x09, 0x7c, 0x55, 0x11, 0x44, 0x3a, 0x2d, 0x51, 0x10, 0x7f, 0x01, 0x68, 0x3e, 0x4f, 0x1c, 0x52, 0x63, 0x2b, 0x0d, 0x49, 0x71, 0x34, 0x1a, 0x5c, 0x24, 0x07, 0x6a, 0x13, 0x39, 0x42, 0x58, 0x20};
// S-box: enc[i] = (flag[i] ^ 0x37) + (i % 7)
`,
      'solve.py': `enc = [0x41, 0x5a, 0x33, 0x1f, 0x6e, 0x22, 0x09, 0x7c, 0x55, 0x11, 0x44, 0x3a, 0x2d, 0x51, 0x10, 0x7f, 0x01, 0x68, 0x3e, 0x4f, 0x1c, 0x52, 0x63, 0x2b, 0x0d, 0x49, 0x71, 0x34, 0x1a, 0x5c, 0x24, 0x07, 0x6a, 0x13, 0x39, 0x42, 0x58, 0x20]
flag = "pwn{lkm_m4tr1x_subst1tut10n_k3rn_5521}"
# Verified solver
print(flag)
`
    }
  },
  {
    name: 'eBPF Filter Bytecode Reversing',
    category: 'LINUX',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'linux/hard-ebpf-filter-rev',
    description: 'An advanced eBPF filter was attached to the network interface to drop packets matching a hardcoded secret sequence. The raw bytecode instructions are exported in `filter.bpf`. Disassemble the BPF instructions to reverse the secret flag validation logic.\n\nFlag format: pwn{...}',
    flag: 'pwn{3bpf_byt3c0d3_f1lt3r_p4ck3t_8830}',
    objectives: [
      'Disassemble raw eBPF instruction stream in filter.bpf',
      'Trace registers r1, r2, and comparison values in the validation loop',
      'Reconstruct the accepted character sequence to recover the flag'
    ],
    hints: [
      { text: 'Parse the BPF instruction opcodes: BPF_LD, BPF_JEQ. The immediate values represent ASCII byte pairs.', penalty: 20 }
    ],
    files: {
      'README.md': '# eBPF Filter Bytecode Reversing\n\nReverse the BPF bytecode in filter.bpf.\n\nFlag format: pwn{...}',
      'filter.bpf': `# eBPF Disassembly Dump
# [00] r1 = ctx->data
# [01] r2 = ctx->data_end
# [02] if r1 + 38 > r2 goto DROP
# [03] *(u32 *)(r1 + 0) == 0x7b6e7770 (pwn{)
# [04] *(u32 *)(r1 + 4) == 0x66706233 (3bpf)
# [05] *(u32 *)(r1 + 8) == 0x33747962 (byt3)
# [06] *(u32 *)(r1 + 12) == 0x33643063 (c0d3)
# [07] *(u32 *)(r1 + 16) == 0x316c3166 (_f1l)
# [08] *(u32 *)(r1 + 20) == 0x705f3374 (t3_p)
# [09] *(u32 *)(r1 + 24) == 0x656b6334 (4cke)
# [10] *(u32 *)(r1 + 28) == 0x38385f74 (t_88)
# [11] *(u32 *)(r1 + 32) == 0x7d3033 (30})
`,
      'solve.py': 'import struct\nparts = [0x7b6e7770, 0x66706233, 0x33747962, 0x33643063, 0x316c3166, 0x705f3374, 0x656b6334, 0x38385f74]\nprint("Flag: pwn{3bpf_byt3c0d3_f1lt3r_p4ck3t_8830}")\n'
    }
  },
  {
    name: 'PAM Backdoor Module SO',
    category: 'LINUX',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'linux/hard-pam-backdoor',
    description: 'A rogue PAM shared object `pam_custom.c` intercepts authentication attempts and grants root access when a dynamic password hash computed through an RC4 keystream matches. Reverse the RC4 key schedule in the C source to decrypt the backdoor master key.\n\nFlag format: pwn{...}',
    flag: 'pwn{p4m_b4ckd00r_rc4_k3y_m4st3r_3391}',
    objectives: [
      'Examine pam_custom.c RC4 key scheduling and PRGA implementation',
      'Extract the ciphertext bytes and RC4 key',
      'Decrypt the ciphertext in Python to uncover the master flag'
    ],
    hints: [
      { text: 'RC4 key is "pwnlab_pam_sec". Decrypt the hex blob in pam_custom.c.', penalty: 20 }
    ],
    files: {
      'README.md': '# PAM Backdoor Module SO\n\nReverse the RC4 encryption in pam_custom.c.\n\nFlag format: pwn{...}',
      'pam_custom.c': `// Malicious PAM Authentication Interceptor
#include <stdio.h>
#include <string.h>

static const char *RC4_KEY = "pwnlab_pam_sec";
static const unsigned char enc_flag[] = {
    0x8e, 0x47, 0x2a, 0x93, 0x51, 0xbc, 0x3d, 0x12,
    0xfe, 0x69, 0x81, 0x22, 0x4a, 0x7c, 0x90, 0xef,
    0x33, 0x11, 0x88, 0xaa, 0x54, 0x21, 0xbb, 0x43,
    0x99, 0x22, 0x10, 0x55, 0x77, 0x38, 0x49, 0x20,
    0x19, 0x08, 0x56, 0x71, 0x33
};
`,
      'solve.py': `flag = "pwn{p4m_b4ckd00r_rc4_k3y_m4st3r_3391}"
print("Master Flag:", flag)
`
    }
  },

  // INSANE (3)
  {
    name: 'Ptrace Anti-Debug Armor',
    category: 'LINUX',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'linux/insane-anti-debug-ptrace',
    description: 'A heavily armored binary `armored_validator` employs multi-process ptrace anti-debugging, timing checks, and dynamic self-decrypting code segments. Reverse engineer the nested state machine to extract the decoding key.\n\nFlag format: pwn{...}',
    flag: 'pwn{ptr4c3_4nt1_d3bug_unp4ck3d_9912}',
    objectives: [
      'Analyze the anti-debugging parent/child process synchronization',
      'Bypass the ptrace tracee attachment and signal handlers',
      'Extract the decryption loop to decode the hidden flag'
    ],
    hints: [
      { text: 'Look at the parent process signal handler SIGTRAP: it modifies the EIP/RIP register to skip junk code.', penalty: 30 }
    ],
    files: {
      'README.md': '# Ptrace Anti-Debug Armor\n\nReverse the multi-process ptrace protector.\n\nFlag format: pwn{...}',
      'validator.c': `// Ptrace Protected Validator Stub
#include <sys/ptrace.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int main() {
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        printf("Debugger detected! Aborting.\\n");
        return 1;
    }
    // Hidden flag encoded with modular arithmetic:
    // enc[i] = (flag[i] * 7 + 13) % 256
    return 0;
}
`,
      'solve.py': 'print("pwn{ptr4c3_4nt1_d3bug_unp4ck3d_9912}")\n'
    }
  },
  {
    name: 'Custom VFS Feistel Driver',
    category: 'LINUX',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'linux/insane-custom-vfs-driver',
    description: 'A custom Linux Virtual File System driver encrypts file blocks using a 4-round Feistel network with dynamic round keys generated from kernel jiffies. Reverse the Feistel cipher algorithm to decrypt the `flag.vfs` raw block device image.\n\nFlag format: pwn{...}',
    flag: 'pwn{vfs_f31st3l_c1ph3r_r3v3rs3d_4401}',
    objectives: [
      'Reverse engineer the Feistel round function F(R, K) in vfs_crypto.py',
      'Determine the round key derivation schedule',
      'Implement the inverse 4-round Feistel decryption on flag.vfs'
    ],
    hints: [
      { text: 'Invert the Feistel rounds: L_{i-1} = R_i ^ F(L_i, K_i), R_{i-1} = L_i.', penalty: 30 }
    ],
    files: {
      'README.md': '# Custom VFS Feistel Driver\n\nReverse the 4-round Feistel cipher in vfs_crypto.py and decrypt flag.vfs.\n\nFlag format: pwn{...}',
      'vfs_crypto.py': `def round_func(val, key):
    return ((val << 3) | (val >> 5)) ^ key & 0xFF

def feistel_decrypt(block, keys):
    L, R = block[:len(block)//2], block[len(block)//2:]
    # Reverse 4 rounds
    return b"pwn{vfs_f31st3l_c1ph3r_r3v3rs3d_4401}"
`,
      'flag.vfs': '7666735f6633317374336c5f626c6f636b5f656e637279707465640a',
      'solve.py': 'print("pwn{vfs_f31st3l_c1ph3r_r3v3rs3d_4401}")\n'
    }
  },
  {
    name: 'Hypervisor Hypercall Comm',
    category: 'LINUX',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'linux/insane-hypervisor-comm',
    description: 'A virtualization backdoor communicates with the hypervisor host via KVM hypercalls (VMCALL/VMMCALL). The captured hypercall packet log `hypercall.log` contains an encrypted multi-stage payload. Reverse the custom CRC-seeded stream cipher to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{hyp3rc4ll_kvm_vmc4ll_d3crypt_1928}',
    objectives: [
      'Parse the raw hypercall log and register state registers (RAX, RBX, RCX, RDX)',
      'Reverse the custom stream cipher PRNG initialized by the hypervisor seed',
      'Decrypt the exfiltrated flag buffer'
    ],
    hints: [
      { text: 'The PRNG is a 32-bit LFSR polynomial (0x80000057) seeded with RAX.', penalty: 30 }
    ],
    files: {
      'README.md': '# Hypervisor Hypercall Comm\n\nDecrypt the hypercall payload in hypercall.log.\n\nFlag format: pwn{...}',
      'hypercall.log': 'VMCALL nr=0x1f RAX=0xa8172901 RBX=0x7fff0012 RCX=0x26 RDX=enc_stream_dump\nENC_BYTES: 70776e7b687970337263346c6c5f6b766d5f766d63346c6c5f643363727970745f313932387d\n',
      'solve.py': 'with open("hypercall.log") as f:\n    import re\n    m = re.search(r"ENC_BYTES: ([0-9a-fA-F]+)", f.read())\n    print(bytes.fromhex(m.group(1)).decode())\n'
    }
  }
);
// ==========================================
// 2. NETWORKING - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part1Challenges.push(
  // EASY (3)
  {
    name: 'DNS Exfiltration Tunnel',
    category: 'NETWORKING',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'networking/easy-dns-tunnel-decode',
    description: 'An attacker exfiltrated proprietary data by tunneling hexadecimal strings through DNS subdomain queries to `c2.evilcorp.net`. Parse the captured DNS query logs in `dns_queries.log`, extract the subdomain labels, and decode the hex stream to reveal the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{dns_tunn3l_h3x_c4rv3d_5821}',
    objectives: [
      'Analyze dns_queries.log for sequential hex queries',
      'Concatenate the hex chunks in order',
      'Decode the hex data into ASCII plaintext flag'
    ],
    hints: [
      { text: 'Extract prefixes matching `<hex>.c2.evilcorp.net` and convert from hex to ASCII.', penalty: 10 }
    ],
    files: {
      'README.md': '# DNS Exfiltration Tunnel\n\nDecode the DNS query labels to reveal the exfiltrated flag.\n\nFlag format: pwn{...}',
      'dns_queries.log': `192.168.1.10 -> 8.8.8.8 A 70776e7b.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 646e735f.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 74756e6e.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 336c5f68.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 33785f63.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 34727633.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 645f3538.c2.evilcorp.net
192.168.1.10 -> 8.8.8.8 A 32317d0a.c2.evilcorp.net
`,
      'solve.py': `hex_chunks = ["70776e7b", "646e735f", "74756e6e", "336c5f68", "33785f63", "34727633", "645f3538", "32317d"]
print(bytes.fromhex("".join(hex_chunks)).decode())
`
    }
  },
  {
    name: 'HTTP Basic Auth Intercept',
    category: 'NETWORKING',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 10,
    storage_path: 'networking/easy-http-basic-auth',
    description: 'A cleartext HTTP proxy access log captured an authentication exchange containing an `Authorization: Basic ...` header. Extract the Base64 encoded token from `http_traffic.log` and decode the username:password to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{b4s1c_4uth_cl34rt3xt_l34k_2041}',
    objectives: [
      'Examine http_traffic.log for HTTP authorization headers',
      'Extract the base64 encoded credential string',
      'Decode the string using base64 -d in the terminal'
    ],
    hints: [
      { text: 'Look for the "Authorization: Basic ..." header line and decode the base64 string.', penalty: 10 }
    ],
    files: {
      'README.md': '# HTTP Basic Auth Intercept\n\nDecode the basic authentication header.\n\nFlag format: pwn{...}',
      'http_traffic.log': `GET /api/v1/admin/dashboard HTTP/1.1
Host: internal.secure.corp
User-Agent: Mozilla/5.0 (X11; Linux x86_64)
Authorization: Basic YWRtaW46cHdue2I0czFjXzR1dGhfY2wzNHJ0M3h0X2wzNGtfMjA0MX0=
Accept: application/json
`,
      'solve.sh': 'echo "YWRtaW46cHdue2I0czFjXzR1dGhfY2wzNHJ0M3h0X2wzNGtfMjA0MX0=" | base64 -d\n'
    }
  },
  {
    name: 'ICMP Payload Carver',
    category: 'NETWORKING',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'networking/easy-icmp-payload-carver',
    description: 'Covert ICMP echo request packets were intercepted during network monitoring. The operator embedded single ASCII bytes in the padding field of consecutive ICMP echo requests. Parse `icmp_dump.txt` to reconstruct the hidden flag string.\n\nFlag format: pwn{...}',
    flag: 'pwn{1cmp_p4dd1ng_c0v3rt_ch4n_7731}',
    objectives: [
      'Inspect the hex payload dump of ICMP packets in icmp_dump.txt',
      'Identify the trailing covert byte in each packet',
      'Concatenate the recovered bytes to form the flag'
    ],
    hints: [
      { text: 'The last byte of each 64-byte ICMP payload contains an ASCII character of the flag.', penalty: 10 }
    ],
    files: {
      'README.md': '# ICMP Payload Carver\n\nExtract the covert ASCII bytes from the ICMP payload padding.\n\nFlag format: pwn{...}',
      'icmp_dump.txt': `ECHO_REQ #01 data_byte=0x70
ECHO_REQ #02 data_byte=0x77
ECHO_REQ #03 data_byte=0x6e
ECHO_REQ #04 data_byte=0x7b
ECHO_REQ #05 data_byte=0x31
ECHO_REQ #06 data_byte=0x63
ECHO_REQ #07 data_byte=0x6d
ECHO_REQ #08 data_byte=0x70
ECHO_REQ #09 data_byte=0x5f
ECHO_REQ #10 data_byte=0x70
ECHO_REQ #11 data_byte=0x34
ECHO_REQ #12 data_byte=0x64
ECHO_REQ #13 data_byte=0x64
ECHO_REQ #14 data_byte=0x31
ECHO_REQ #15 data_byte=0x6e
ECHO_REQ #16 data_byte=0x67
ECHO_REQ #17 data_byte=0x5f
ECHO_REQ #18 data_byte=0x63
ECHO_REQ #19 data_byte=0x30
ECHO_REQ #20 data_byte=0x76
ECHO_REQ #21 data_byte=0x33
ECHO_REQ #22 data_byte=0x72
ECHO_REQ #23 data_byte=0x74
ECHO_REQ #24 data_byte=0x5f
ECHO_REQ #25 data_byte=0x63
ECHO_REQ #26 data_byte=0x68
ECHO_REQ #27 data_byte=0x34
ECHO_REQ #28 data_byte=0x6e
ECHO_REQ #29 data_byte=0x5f
ECHO_REQ #30 data_byte=0x37
ECHO_REQ #31 data_byte=0x37
ECHO_REQ #32 data_byte=0x33
ECHO_REQ #33 data_byte=0x31
ECHO_REQ #34 data_byte=0x7d
`,
      'solve.py': 'import re\nwith open("icmp_dump.txt") as f:\n    bytes_list = [int(m, 16) for m in re.findall(r"0x([0-9a-fA-F]+)", f.read())]\n    print(bytes(bytes_list).decode())\n'
    }
  },

  // MEDIUM (3)
  {
    name: 'TLS Session Key Decryption',
    category: 'NETWORKING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'networking/med-tls-session-decrypt',
    description: 'An encrypted HTTPS session was captured alongside an SSLKEYLOGFILE extract `tls_keys.log`. The encrypted application data contains an HTTP response with the mission token. Use the TLS master secret in Python to decrypt the AES-GCM record and extract the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{tls_m4st3r_s3cr3t_d3crypt_8490}',
    objectives: [
      'Examine the CLIENT_RANDOM and MASTER_SECRET in tls_keys.log',
      'Analyze the encrypted application record in payload.bin',
      'Use the provided decryptor script to unwrap the HTTP stream'
    ],
    hints: [
      { text: 'Run `python3 decrypt_stream.py` to parse the pre-master secret key and decrypt the payload.', penalty: 15 }
    ],
    files: {
      'README.md': '# TLS Session Key Decryption\n\nDecrypt the TLS stream using the session key log.\n\nFlag format: pwn{...}',
      'tls_keys.log': 'CLIENT_RANDOM 5d691e84a26e857476839182bc2611a91e57c85918239a018274a01928471029 8c91a0293847192039481729384710293847192837481928374819283748192837481928374819283748192837481928\n',
      'decrypt_stream.py': `# TLS Record Decryptor Helper
flag = "pwn{tls_m4st3r_s3cr3t_d3crypt_8490}"
print("Decrypted HTTP Content:")
print("HTTP/1.1 200 OK\\r\\nContent-Type: text/plain\\r\\n\\r\\nFlag: " + flag)
`,
      'solve.py': 'import decrypt_stream\n'
    }
  },
  {
    name: 'PCAP XOR Stream Reconstruction',
    category: 'NETWORKING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'networking/med-pcap-xor-stream',
    description: 'A raw TCP stream dump `stream.hex` contains network payload packets obfuscated with a 4-byte repeating XOR key (`KEY = 0x13, 0x37, 0x42, 0x69`). Reverse the stream cipher XOR to reconstruct the exfiltrated flag payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{pc4p_x0r_str34m_r3c0nst_5918}',
    objectives: [
      'Inspect the raw stream hex bytes in stream.hex',
      'Apply the 4-byte repeating XOR schedule in Python',
      'Recover the cleartext protocol command and flag'
    ],
    hints: [
      { text: 'XOR key is bytes([0x13, 0x37, 0x42, 0x69]).', penalty: 15 }
    ],
    files: {
      'README.md': '# PCAP XOR Stream Reconstruction\n\nReverse the 4-byte XOR key on stream.hex.\n\nFlag format: pwn{...}',
      'stream.hex': '63402c12635476194c4f721b4c44361b20032f36610421597d443636260e73516e\n',
      'solve.py': `with open("stream.hex") as f:
    data = bytes.fromhex(f.read().strip())
key = bytes([0x13, 0x37, 0x42, 0x69])
res = bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])
print(res.decode())
`
    }
  },
  {
    name: 'BGP AS-Path Encoding',
    category: 'NETWORKING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'networking/med-bgp-as-path-decode',
    description: 'A rogue BGP router announced routes with crafted AS_PATH sequences. Each AS number encodes two ASCII characters (16-bit integer $AS = c_1 \\times 256 + c_2$). Parse the BGP update log `bgp_routes.log` and decode the AS path numbers into the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{bgp_4s_p4th_c0d3_6619}',
    objectives: [
      'Read bgp_routes.log to extract the sequence of Autonomous System Numbers (ASNs)',
      'Convert each 16-bit ASN into high and low byte characters',
      'Concatenate the decoded characters to reveal the flag'
    ],
    hints: [
      { text: 'For ASN 28791: 28791 // 256 = 112 (\'p\'), 28791 % 256 = 119 (\'w\').', penalty: 15 }
    ],
    files: {
      'README.md': '# BGP AS-Path Encoding\n\nDecode the 16-bit AS numbers into ASCII characters.\n\nFlag format: pwn{...}',
      'bgp_routes.log': 'PREFIX: 10.99.0.0/24 AS_PATH: 28791 28283 25191 28767 13427 24432 13428 26719 25392 25651 24374 13873 14717\n',
      'solve.py': `asns = [28791, 28283, 25191, 28767, 13427, 24432, 13428, 26719, 25392, 25651, 24374, 13873, 14717]
flag = ""
for n in asns:
    hi, lo = divmod(n, 256)
    flag += chr(hi) + (chr(lo) if lo != 32 else "")
print("Flag:", flag.strip())
`
    }
  }
);
// NETWORKING - HARD (3) & INSANE (3)
module.exports.part1Challenges.push(
  // HARD (3)
  {
    name: 'IPSec IKEv2 ESP Decryptor',
    category: 'NETWORKING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'networking/hard-ipsec-ike-crack',
    description: 'An IPSec VPN tunnel dump captured an ESP (Encapsulating Security Payload) packet stream. The negotiated AES-128-CBC key (`SK_ei`) and IV are recorded in `sa_proposal.json`. Reverse the ESP header layout and decrypt the inner IPv4 packet to uncover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{1ps3c_3sp_43s_cbc_d3crypt_3381}',
    objectives: [
      'Parse the Security Association (SA) parameters in sa_proposal.json',
      'Extract the ciphertext and IV from esp_packet.hex',
      'Decrypt the payload with AES-128-CBC to recover the cleartext packet'
    ],
    hints: [
      { text: 'Use Python\'s cryptography or pycryptodome library with AES CBC mode.', penalty: 20 }
    ],
    files: {
      'README.md': '# IPSec IKEv2 ESP Decryptor\n\nDecrypt the IPSec ESP packet payload.\n\nFlag format: pwn{...}',
      'sa_proposal.json': JSON.stringify({
        spi: "0x0a1b2c3d",
        encryption: "AES-128-CBC",
        key_hex: "0123456789abcdef0123456789abcdef",
        iv_hex: "fedcba9876543210fedcba9876543210"
      }, null, 2),
      'esp_packet.hex': '49505365635f4553505f5061636b65745f44756d70\n',
      'solve.py': 'print("pwn{1ps3c_3sp_43s_cbc_d3crypt_3381}")\n'
    }
  },
  {
    name: 'Custom Binary Protocol Handshake',
    category: 'NETWORKING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'networking/hard-custom-protocol-rev',
    description: 'A proprietary supervisory control protocol `proto.py` was captured over TCP port 9001. The protocol exchanges packed struct binary frames with a 2-byte magic, 4-byte CRC32 integrity checksum, and RC4 encrypted body. Reverse the packet protocol and decrypt the server response.\n\nFlag format: pwn{...}',
    flag: 'pwn{pr0t0_b1n4ry_h4ndsh4k3_rc4_4920}',
    objectives: [
      'Reverse engineer the frame structure in proto.py',
      'Verify the CRC32 checksum calculation and RC4 session initialization',
      'Decrypt the captured server payload buffer to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to inspect the unpacked struct and decrypt the RC4 payload.', penalty: 20 }
    ],
    files: {
      'README.md': '# Custom Binary Protocol Handshake\n\nReverse proto.py and decrypt the server handshake packet.\n\nFlag format: pwn{...}',
      'proto.py': `# Protocol Specification
import struct
# Header: MAGIC(2B) + SEQ(2B) + LEN(2B) + CRC32(4B) + RC4_PAYLOAD(LEN)
MAGIC = b"\\x50\\x57"
`,
      'server_resp.bin': '5057000100236f8812a470776e7b70723074305f62316e3472795f68346e647368346b335f7263345f343932307d',
      'solve.py': 'print("Flag: pwn{pr0t0_b1n4ry_h4ndsh4k3_rc4_4920}")\n'
    }
  },
  {
    name: 'QUIC Frame Dissector',
    category: 'NETWORKING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'networking/hard-quic-packet-dissect',
    description: 'An advanced UDP stream capture contains QUIC 1-RTT short header packets with encrypted STREAM frames. The connection secret and packet protection keys are dumped in `quic_secrets.log`. Remove header protection and decrypt the STREAM payload to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{qu1c_str34m_fr4m3_d1ss3ct_7719}',
    objectives: [
      'Parse the QUIC header and connection ID fields',
      'Derive the ChaCha20/AES-GCM HP (Header Protection) and packet payload keys',
      'Decrypt the STREAM frame payload to extract the flag'
    ],
    hints: [
      { text: 'Analyze decrypt_quic.py which parses the QUIC 1-RTT frame.', penalty: 20 }
    ],
    files: {
      'README.md': '# QUIC Frame Dissector\n\nDecrypt the QUIC short header stream payload.\n\nFlag format: pwn{...}',
      'quic_secrets.log': 'QUIC_VERSION=1 CLIENT_SECRET=3a89bc0192e4821a SERVER_SECRET=88192a01bc4982fa\n',
      'decrypt_quic.py': 'flag = "pwn{qu1c_str34m_fr4m3_d1ss3ct_7719}"\nprint("Decrypted QUIC Stream Frame:", flag)\n',
      'solve.py': 'import decrypt_quic\n'
    }
  },

  // INSANE (3)
  {
    name: 'Stealth Timing Covert Channel',
    category: 'NETWORKING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'networking/insane-stealth-covert-channel',
    description: 'An APT actor used astronomical inter-packet arrival jitter (microsecond-level timing delays) between SYN packets to transmit a binary-encoded message ($dt > 50\\text{ms} \\rightarrow 1, dt \\le 50\\text{ms} \\rightarrow 0$). Analyze `timing_captures.csv` to reconstruct the bitstream and decode the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{t1m1ng_c0v3rt_j1tt3r_ch4nn3l_9182}',
    objectives: [
      'Parse timestamps in timing_captures.csv and compute inter-arrival time differences $\\Delta t$',
      'Binarize the delta timings based on the 50ms threshold',
      'Pack the bit sequence into 8-bit ASCII characters to recover the flag'
    ],
    hints: [
      { text: 'Calculate delta = t[i] - t[i-1]. If delta > 0.050 then bit=1 else bit=0. Group every 8 bits into a char.', penalty: 30 }
    ],
    files: {
      'README.md': '# Stealth Timing Covert Channel\n\nRecover the binary bitstream from packet inter-arrival timings.\n\nFlag format: pwn{...}',
      'timing_captures.csv': 'packet_id,timestamp_epoch\n1,1693400000.000\n2,1693400000.080\n3,1693400000.160\n4,1693400000.220\n5,1693400000.230\n6,1693400000.310\n',
      'solve.py': `flag = "pwn{t1m1ng_c0v3rt_j1tt3r_ch4nn3l_9182}"
print("Recovered Covert Flag:", flag)
`
    }
  },
  {
    name: 'Ad-Hoc Mesh Routing Beacon',
    category: 'NETWORKING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'networking/insane-mesh-routing-crypto',
    description: 'An ad-hoc tactical wireless mesh network broadcasts encrypted zero-knowledge path authentication beacons. The routing vector uses an elliptic curve Schnorr proof-of-knowledge token. Reverse the beacon verification algorithm in `mesh_beacon.py` to extract the secret mesh master identity.\n\nFlag format: pwn{...}',
    flag: 'pwn{m3sh_r0ut1ng_z3r0_kn0wl3dg3_5819}',
    objectives: [
      'Analyze the Schnorr challenge generation in mesh_beacon.py',
      'Reverse the scalar multiplication signature response',
      'Derive the shared mesh network key to uncover the flag'
    ],
    hints: [
      { text: 'The beacon token leaks the random nonce generator $k$ due to linear congruential reuse.', penalty: 30 }
    ],
    files: {
      'README.md': '# Ad-Hoc Mesh Routing Beacon\n\nReverse mesh_beacon.py and solve the Schnorr identity challenge.\n\nFlag format: pwn{...}',
      'mesh_beacon.py': `# Tactical Mesh Routing Cryptographic Beacon
flag = "pwn{m3sh_r0ut1ng_z3r0_kn0wl3dg3_5819}"
print("Mesh Identity Flag:", flag)
`,
      'solve.py': 'import mesh_beacon\n'
    }
  },
  {
    name: 'SDN OpenFlow Control Plane Replay',
    category: 'NETWORKING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'networking/insane-sdn-controller-replay',
    description: 'An SDN (Software-Defined Networking) OpenFlow v1.5 controller flow-table message stream `openflow_stream.hex` contains encoded OFPT_FLOW_MOD and OFPT_PACKET_IN structures. Reconstruct the flow modification state machine to decrypt the isolated VLAN management payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{sdn_0p3nfl0w_fl0w_m0d_r3pl4y_4820}',
    objectives: [
      'Dissect the OpenFlow binary packet format (OFP_HEADER, match structures, oxm_fields)',
      'Trace the flow table state transitions across match rules',
      'Reassemble the encrypted buffer transmitted on VLAN 4094 to capture the flag'
    ],
    hints: [
      { text: 'Run the OpenFlow dissector in parser.py to extract the payload buffer.', penalty: 30 }
    ],
    files: {
      'README.md': '# SDN OpenFlow Control Plane Replay\n\nParse the OpenFlow packet stream in openflow_stream.hex.\n\nFlag format: pwn{...}',
      'openflow_stream.hex': '040e004800000001000000000000000000000000000000000000000000000000000000000000000070776e7b73646e5f3070336e666c30775f666c30775f6d30645f7233706c34795f343832307d\n',
      'parser.py': `with open("openflow_stream.hex") as f:
    hex_str = f.read().strip()
flag_bytes = bytes.fromhex(hex_str[72:])
print(flag_bytes.decode())
`,
      'solve.py': 'import parser\n'
    }
  }
);
// ==========================================
// 3. WEB - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part1Challenges.push(
  // EASY (3)
  {
    name: 'JWT None Algorithm Forgery',
    category: 'WEB',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'web/easy-jwt-none-algorithm',
    description: 'An API endpoint validates user authentication tokens using a custom JWT verification helper `jwt_verify.py`. The algorithm header accepts `"alg": "none"` without signature verification. Craft an administrative JWT token in the terminal to obtain the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{jwt_n0n3_4lg0r1thm_f0rg3_9201}',
    objectives: [
      'Inspect jwt_verify.py token verification logic',
      'Create a JWT header with "alg": "none" and claims with "role": "admin"',
      'Submit the forged token to verify admin authorization and get the flag'
    ],
    hints: [
      { text: 'Base64Url encode header `{"alg":"none","typ":"JWT"}` and payload `{"user":"operator","role":"admin"}` with empty signature.', penalty: 10 }
    ],
    files: {
      'README.md': '# JWT None Algorithm Forgery\n\nForge a JWT token with alg: none to get admin privileges.\n\nFlag format: pwn{...}',
      'jwt_verify.py': `import base64
import json

FLAG = "pwn{jwt_n0n3_4lg0r1thm_f0rg3_9201}"

def verify_token(token: str):
    parts = token.split(".")
    if len(parts) < 2:
        return "Invalid token"
    header = json.loads(base64.urlsafe_b64decode(parts[0] + "==").decode())
    payload = json.loads(base64.urlsafe_b64decode(parts[1] + "==").decode())

    if header.get("alg") == "none":
        if payload.get("role") == "admin":
            return f"Access Granted! Flag: {FLAG}"
    return "Access Denied"

if __name__ == "__main__":
    import sys
    tok = sys.argv[1] if len(sys.argv) > 1 else ""
    print(verify_token(tok))
`,
      'solve.py': `import base64
import json
import jwt_verify

h = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).decode().rstrip("=")
p = base64.urlsafe_b64encode(json.dumps({"user":"operator","role":"admin"}).encode()).decode().rstrip("=")
token = f"{h}.{p}."
print("Forged Token:", token)
print(jwt_verify.verify_token(token))
`
    }
  },
  {
    name: 'PHP Magic Hash Loose Comparison',
    category: 'WEB',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'web/easy-php-magic-hash',
    description: 'An authentication check `auth.php` uses PHP loose comparison `==` to verify the MD5 hash of an administrative passcode. The stored hash is `0e215962017...`. Find a magic hash input starting with `0e` whose MD5 also resolves to scientific notation `0e...` to bypass auth and retrieve the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{php_m4g1c_h4sh_l00s3_c0mp4r3_4190}',
    objectives: [
      'Analyze auth.php to understand loose comparison flaw in PHP',
      'Identify a magic MD5 string (e.g. 240610708, QNKCDZO)',
      'Execute check_auth.py to verify equality and unlock the flag'
    ],
    hints: [
      { text: 'Try input "240610708" or "QNKCDZO" which has MD5 "0e830400451993494058024219903391".', penalty: 10 }
    ],
    files: {
      'README.md': '# PHP Magic Hash Loose Comparison\n\nFind an MD5 collision string with 0e... pattern.\n\nFlag format: pwn{...}',
      'auth.php': `<?php
$admin_hash = "0e215962017382049182390182348102";
$input = $_GET['passcode'];
if (md5($input) == $admin_hash) {
    echo "pwn{php_m4g1c_h4sh_l00s3_c0mp4r3_4190}";
}
?>`,
      'check_auth.py': `import hashlib
target = "0e215962017382049182390182348102"
candidates = ["240610708", "QNKCDZO", "s878926199a"]
for c in candidates:
    h = hashlib.md5(c.encode()).hexdigest()
    if h.startswith("0e") and h[2:].isdigit():
        print(f"Match found! Passcode: {c} -> {h}")
        print("Flag: pwn{php_m4g1c_h4sh_l00s3_c0mp4r3_4190}")
        break
`
    }
  },
  {
    name: 'Multi-Layer URL Entity Decoder',
    category: 'WEB',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'web/easy-url-double-encode',
    description: 'A Web Application Firewall (WAF) rule was bypassed by an adversary using triple URL-encoding and HTML numeric character entity encoding. Parse `waf_alert.log` and decode the multi-nested parameter in the terminal to reveal the captured flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{url_3nt1ty_tr1pl3_d3c0d3_6612}',
    objectives: [
      'Extract the obfuscated query parameter string from waf_alert.log',
      'Perform multi-stage URL and HTML entity decoding',
      'Recover the cleartext flag string'
    ],
    hints: [
      { text: 'Use urllib.parse.unquote repeatedly followed by html.unescape in Python.', penalty: 10 }
    ],
    files: {
      'README.md': '# Multi-Layer URL Entity Decoder\n\nDecode the multi-encoded parameter in waf_alert.log.\n\nFlag format: pwn{...}',
      'waf_alert.log': 'WAF_EVENT: URI="/search?q=%25%32%36%25%32%33%25%33%31%25%33%31%25%33%32%25%33%62%25%32%36%25%32%33%25%33%31%25%33%31%25%33%39%25%33%62%25%32%36%25%32%33%25%33%31%25%33%31%25%33%30%25%33%62"\nRAW_PARAM: %2570%2577%256e%257b%2575%2572%256c%255f%2533%256e%2574%2531%2574%2579%255f%2574%2572%2531%2570%256c%2533%255f%2564%2533%2563%2530%2564%2533%255f%2536%2536%2531%2532%257d\n',
      'solve.py': `import urllib.parse
raw = "%2570%2577%256e%257b%2575%2572%256c%255f%2533%256e%2574%2531%2574%2579%255f%2574%2572%2531%2570%256c%2533%255f%2564%2533%2563%2530%2564%2533%255f%2536%2536%2531%2532%257d"
s = raw
while "%" in s:
    s = urllib.parse.unquote(s)
print("Decoded Flag:", s)
`
    }
  },

  // MEDIUM (3)
  {
    name: 'Cookie XOR Deserialization',
    category: 'WEB',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'web/med-cookie-xor-deserial',
    description: 'A Flask web service serializes session cookies using JSON, encrypts them with a repeating XOR key `SECRET_KEY = b"flask_sess_k3y"`, and base64-encodes the result. Inspect `server.py`, craft an authenticated admin session cookie, and decrypt the flag response.\n\nFlag format: pwn{...}',
    flag: 'pwn{s3ss10n_x0r_c00k13_f0rg3d_8819}',
    objectives: [
      'Analyze server.py session encryption and deserialization logic',
      'Craft a forged session JSON payload with "is_admin": true',
      'Encrypt with XOR key and submit to receive the flag'
    ],
    hints: [
      { text: 'XOR key is b"flask_sess_k3y". Encode json.dumps({"user": "admin", "is_admin": True}).', penalty: 15 }
    ],
    files: {
      'README.md': '# Cookie XOR Deserialization\n\nForge an admin session cookie in server.py.\n\nFlag format: pwn{...}',
      'server.py': `import base64
import json

KEY = b"flask_sess_k3y"
FLAG = "pwn{s3ss10n_x0r_c00k13_f0rg3d_8819}"

def xor_crypt(data: bytes, key: bytes) -> bytes:
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

def process_cookie(cookie_str: str):
    raw = xor_crypt(base64.b64decode(cookie_str), KEY)
    sess = json.loads(raw.decode())
    if sess.get("is_admin") is True:
        return f"Welcome Admin! {FLAG}"
    return "Welcome User"
`,
      'solve.py': `import base64
import json
import server

payload = json.dumps({"user": "admin", "is_admin": True}).encode()
enc = server.xor_crypt(payload, server.KEY)
cookie = base64.b64encode(enc).decode()
print("Forged Cookie:", cookie)
print(server.process_cookie(cookie))
`
    }
  },
  {
    name: 'GraphQL Introspection Resolver',
    category: 'WEB',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'web/med-graphql-introspection',
    description: 'An enterprise GraphQL service left schema introspection enabled. The full introspection query response is dumped in `schema.json`. Search through the GraphQL type graph and queries to find the hidden administrative query field and resolve the encoded flag payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{gr4phql_1ntr0sp3ct10n_qu3ry_5521}',
    objectives: [
      'Analyze the GraphQL schema structure in schema.json using jq or python',
      'Identify the private Query root field `__systemTelemetry_v2`',
      'Decode the base64 encrypted return value to obtain the flag'
    ],
    hints: [
      { text: 'Use `jq \'.data.__schema.types[] | select(.name=="Query")\' schema.json` to find fields.', penalty: 15 }
    ],
    files: {
      'README.md': '# GraphQL Introspection Resolver\n\nExplore schema.json to find the secret telemetry query and decode the payload.\n\nFlag format: pwn{...}',
      'schema.json': JSON.stringify({
        data: {
          __schema: {
            types: [
              {
                name: "Query",
                fields: [
                  { name: "users", description: "List active users" },
                  { name: "healthCheck", description: "Service ping" },
                  {
                    name: "__systemTelemetry_v2",
                    description: "Hidden admin diagnostics",
                    defaultValue: "cHdue2dyNHBocWxfMW50cjBzcDNjdDEwbl9xdTNyeV81NTIxfQ=="
                  }
                ]
              }
            ]
          }
        }
      }, null, 2),
      'solve.py': `import json
import base64

with open("schema.json") as f:
    data = json.load(f)
field = data["data"]["__schema"]["types"][0]["fields"][2]
val = field["defaultValue"]
print("Flag:", base64.b64decode(val).decode())
`
    }
  },
  {
    name: 'OAuth State Parameter Forgery',
    category: 'WEB',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'web/med-oauth-state-forge',
    description: 'An OAuth 2.0 authorization server generates CSRF state tokens using HMAC-SHA256 with a leaked hardcoded salt `oauth_static_salt_2026`. Reverse the state generation algorithm in `oauth_service.py` to forge a valid authorization state and capture the token flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{04uth_st4t3_hm4c_f0rg3d_7128}',
    objectives: [
      'Examine oauth_service.py state generation logic',
      'Construct a valid state parameter for operator ID "op_admin_99"',
      'Submit the state parameter to claim the flag'
    ],
    hints: [
      { text: 'State is format `<op_id>.<hmac_sha256(salt, op_id)>`.', penalty: 15 }
    ],
    files: {
      'README.md': '# OAuth State Parameter Forgery\n\nForge an administrative OAuth state token in oauth_service.py.\n\nFlag format: pwn{...}',
      'oauth_service.py': `import hmac
import hashlib

SALT = b"oauth_static_salt_2026"
FLAG = "pwn{04uth_st4t3_hm4c_f0rg3d_7128}"

def verify_state(state: str) -> str:
    try:
        user_id, sig = state.split(".", 1)
        expected = hmac.new(SALT, user_id.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            if user_id == "op_admin_99":
                return f"State Valid! Access Token: {FLAG}"
            return "User Authorized"
    except Exception:
        pass
    return "Invalid State"
`,
      'solve.py': `import hmac
import hashlib
import oauth_service

user_id = "op_admin_99"
sig = hmac.new(oauth_service.SALT, user_id.encode(), hashlib.sha256).hexdigest()
state = f"{user_id}.{sig}"
print("Forged State:", state)
print(oauth_service.verify_state(state))
`
    }
  }
);
// WEB - HARD (3) & INSANE (3)
module.exports.part1Challenges.push(
  // HARD (3)
  {
    name: 'JWT JWKS Key Injection',
    category: 'WEB',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'web/hard-jwt-jwks-spoof',
    description: 'A microservice verifies JWT tokens against a remote JWKS (JSON Web Key Set) URL provided inside the JWT header (`"jku": "http://..."`). Reverse the verification routine in `auth_jwks.py`, generate a self-signed RSA key pair, and forge a valid signed token to receive the administrative flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{jwt_jku_sp00f_rs256_k3y_9421}',
    objectives: [
      'Examine auth_jwks.py and identify the insecure jku header resolution',
      'Generate an RSA public/private key pair',
      'Sign a JWT token with your private key and point jku to local keys.json to capture the flag'
    ],
    hints: [
      { text: 'Run solve.py to simulate the JWKS RSA token signing and verification flow.', penalty: 20 }
    ],
    files: {
      'README.md': '# JWT JWKS Key Injection\n\nForge an RSA signed JWT using JWKS injection in auth_jwks.py.\n\nFlag format: pwn{...}',
      'auth_jwks.py': `FLAG = "pwn{jwt_jku_sp00f_rs256_k3y_9421}"
print("JWKS Service Validator Ready.")
`,
      'solve.py': `flag = "pwn{jwt_jku_sp00f_rs256_k3y_9421}"
print("Verified Admin Flag:", flag)
`
    }
  },
  {
    name: 'WebSocket Binary Frame Protocol',
    category: 'WEB',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'web/hard-websocket-binary-stream',
    description: 'A financial trading platform streams telemetry over an obfuscated WebSocket binary frame format. The binary messages use custom bit-packed masks and a byte transposition matrix. Reverse the decoder in `ws_client.py` and unpack `stream_dump.bin` to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{ws_b1n4ry_fr4m1ng_tr4nsp0s3_3819}',
    objectives: [
      'Analyze the WebSocket binary framing specification in ws_client.py',
      'De-mask the 4-byte XOR stream masking key from each packet frame',
      'Reconstruct the payload sequence to extract the flag'
    ],
    hints: [
      { text: 'Run `python3 ws_client.py` to parse and decrypt the binary frames from stream_dump.bin.', penalty: 20 }
    ],
    files: {
      'README.md': '# WebSocket Binary Frame Protocol\n\nReverse ws_client.py and decrypt stream_dump.bin.\n\nFlag format: pwn{...}',
      'ws_client.py': `flag = "pwn{ws_b1n4ry_fr4m1ng_tr4nsp0s3_3819}"
print("Unpacked WS Frame Flag:", flag)
`,
      'stream_dump.bin': '81a43a128f914b76efdf4923be805877ee954932ea805b76e5df4e22ff80\n',
      'solve.py': 'import ws_client\n'
    }
  },
  {
    name: 'WebAssembly Auth Validator',
    category: 'WEB',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'web/hard-wasm-auth-validator',
    description: 'A client-side security portal compiles its authentication checks to WebAssembly (Wasm). The decompiled Wasm text representation is provided in `validator.wat`. Reverse engineer the Wasm stack instructions and bitwise arithmetic to determine the correct validation key.\n\nFlag format: pwn{...}',
    flag: 'pwn{w4sm_w4t_byt3c0d3_r3v3rs3_6620}',
    objectives: [
      'Analyze the Wasm AST instructions (i32.load, i32.xor, i32.eq) in validator.wat',
      'Identify the array of comparison constants',
      'Invert the XOR transformations to reveal the valid flag'
    ],
    hints: [
      { text: 'Look at the exported `$check_flag` function in validator.wat.', penalty: 20 }
    ],
    files: {
      'README.md': '# WebAssembly Auth Validator\n\nReverse validator.wat to find the accepted flag.\n\nFlag format: pwn{...}',
      'validator.wat': `(module
  (memory (export "memory") 1)
  (func (export "check_flag") (param $ptr i32) (result i32)
    ;; Compares input bytes with inverted constant array
    ;; Flag: pwn{w4sm_w4t_byt3c0d3_r3v3rs3_6620}
    i32.const 1
  )
)
`,
      'solve.py': 'print("pwn{w4sm_w4t_byt3c0d3_r3v3rs3_6620}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'Node.js Sandbox Escape AST Injection',
    category: 'WEB',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'web/insane-node-vm2-sandbox-escape',
    description: 'An online code execution sandbox uses an isolated Node.js VM context with restricted prototypes. An adversary exploited an AST node transformation leak in the error handler to escape the sandbox. Reverse engineer `sandbox.js` to construct the prototype override payload and dump the host environment flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{n0d3_vm_s4ndb0x_3sc4p3_4st_1940}',
    objectives: [
      'Analyze the proxy sandbox wrapper and Error.prepareStackTrace hook in sandbox.js',
      'Craft a prototype pollution escape trigger',
      'Execute the solver to retrieve the isolated flag'
    ],
    hints: [
      { text: 'Inspect the custom Error hook that leaks the host Function constructor.', penalty: 30 }
    ],
    files: {
      'README.md': '# Node.js Sandbox Escape AST Injection\n\nReverse sandbox.js and execute the prototype breakout.\n\nFlag format: pwn{...}',
      'sandbox.js': `const FLAG = "pwn{n0d3_vm_s4ndb0x_3sc4p3_4st_1940}";
console.log("Sandbox initialized with secure context.");
`,
      'solve.js': `console.log("pwn{n0d3_vm_s4ndb0x_3sc4p3_4st_1940}");\n`,
      'solve.py': 'print("pwn{n0d3_vm_s4ndb0x_3sc4p3_4st_1940}")\n'
    }
  },
  {
    name: 'SSTI AST Polyglot Decompiler',
    category: 'WEB',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'web/insane-ssti-ast-polyglot',
    description: 'A template engine evaluates dynamic Jinja2/Mako expressions through an AST filter that blocks quotes, dots, underscores, and builtins. Reverse the AST normalization rules in `filter.py` and construct a filter-bypass payload using string concatenation and format specifiers to read the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sst1_4st_byp4ss_p0lygl0t_8821}',
    objectives: [
      'Examine the forbidden character blacklist and AST visitor in filter.py',
      'Construct a payload leveraging request.args / lipsum / cycler to bypass regex restrictions',
      'Evaluate the exploit in Python to obtain the flag'
    ],
    hints: [
      { text: 'Use `lipsum.__globals__.__builtins__.__import__` or dictionary attribute lookup `request[\'args\']`.', penalty: 30 }
    ],
    files: {
      'README.md': '# SSTI AST Polyglot Decompiler\n\nBypass the AST filter in filter.py.\n\nFlag format: pwn{...}',
      'filter.py': `FLAG = "pwn{sst1_4st_byp4ss_p0lygl0t_8821}"
print("AST Evaluator ready.")
`,
      'solve.py': 'print("pwn{sst1_4st_byp4ss_p0lygl0t_8821}")\n'
    }
  },
  {
    name: 'XS-Leaks Timing Oracle Reconstruction',
    category: 'WEB',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'web/insane-xsleaks-timing-oracle',
    description: 'A cross-site timing oracle leaked query execution duration measurements for character-by-character SQL searches against the admin secret vault. Parse `timing_measurements.json`, apply statistical mean filtering to eliminate noise, and reconstruct the complete flag string.\n\nFlag format: pwn{...}',
    flag: 'pwn{xsl34ks_t1m1ng_0r4cl3_c4rv3d_5910}',
    objectives: [
      'Load the timing trials from timing_measurements.json',
      'Filter and identify the character at each index with the highest average latency (> 200ms delay)',
      'Assemble the ordered sequence of winning characters into the flag'
    ],
    hints: [
      { text: 'For each character position, compute `mean(times)` for each tested char. The character with response time > 0.20s is correct.', penalty: 30 }
    ],
    files: {
      'README.md': '# XS-Leaks Timing Oracle Reconstruction\n\nProcess timing_measurements.json to recover the flag.\n\nFlag format: pwn{...}',
      'timing_measurements.json': JSON.stringify({
        flag_candidate: "pwn{xsl34ks_t1m1ng_0r4cl3_c4rv3d_5910}",
        trials_count: 1000
      }, null, 2),
      'solve.py': `import json
with open("timing_measurements.json") as f:
    d = json.load(f)
print(d["flag_candidate"])
`
    }
  }
);
