const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../lib/supabase-admin');
require('dotenv').config({ path: '.env.local' });

const ROOT = '/home/misery/pwnlab/challenges';

const allChallenges = [
  // ================= EASY (5) =================
  {
    name: 'Cookie Monster',
    category: 'WEB',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'web/cookie-monster',
    description: 'An authentication portal stores session information in client-side cookies using base64-encoded JSON. Inspect the serialization logic, forge an admin cookie, and obtain the flag.',
    flag: 'pwnlab{c00k13_m0nst3r_s3ss10n_f0rg3d_9821}',
    objectives: [
      'Download and inspect the challenge source code',
      'Analyze the session cookie structure in app.py',
      'Craft a forged cookie with admin privileges and submit the flag'
    ],
    hints: [
      { text: 'Base64 decode the session cookie to see its JSON keys.', penalty: 10 }
    ],
    files: {
      'app.py': `# Cookie Monster - pwnlab
import base64
import json
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)
FLAG = 'pwnlab{c00k13_m0nst3r_s3ss10n_f0rg3d_9821}'

@app.route('/')
def index():
    session_cookie = request.cookies.get('session')
    if not session_cookie:
        default_session = {'user': 'guest', 'role': 'user', 'is_admin': False}
        encoded = base64.b64encode(json.dumps(default_session).encode()).decode()
        resp = make_response(jsonify({'message': 'Welcome guest. Admin access required.'}))
        resp.set_cookie('session', encoded)
        return resp

    try:
        data = json.loads(base64.b64decode(session_cookie).decode())
        if data.get('is_admin') is True or data.get('role') == 'admin':
            return jsonify({'message': 'Welcome Administrator!', 'flag': FLAG})
        return jsonify({'message': f"Welcome {data.get('user', 'guest')}", 'access': 'denied'})
    except Exception:
        return jsonify({'error': 'Invalid session'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`,
      'solve.py': `# Solution helper
import base64
import json

payload = {'user': 'admin', 'role': 'admin', 'is_admin': True}
cookie = base64.b64encode(json.dumps(payload).encode()).decode()
print("Forged Cookie:", cookie)
`,
      'README.md': `# Cookie Monster

Forge an admin cookie using the serialization flaw in \`app.py\`.
Flag format: pwnlab{...}
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
    description: 'A multi-byte rotating shift cipher was intercepted from an automated beacon. Decrypt the ciphertext hex using the inverse shift schedule.',
    flag: 'pwnlab{c43s4r_m4tr1x_c1ph3r_cr4ck3d_4910}',
    objectives: [
      'Analyze the encryption algorithm in encrypt.py',
      'Determine the shift key sequence',
      'Reverse the shift operation on ciphertext.hex'
    ],
    hints: [
      { text: 'Modulo 256 arithmetic is used for each byte in the rotation list.', penalty: 10 }
    ],
    files: {
      'encrypt.py': `# Caesar Matrix Encryptor
SHIFT_KEY = [3, 7, 13, 19, 23]

def encrypt(text, shifts):
    res = []
    for i, char in enumerate(text):
        shift = shifts[i % len(shifts)]
        res.append(chr((ord(char) + shift) % 256))
    return bytes([ord(c) for c in res])

# Ciphertext generated from flag
`,
      'ciphertext.hex': '7384777b6e798e6637367637856270377785347b75347335756673628e67373c363380',
      'solver.py': `# Solution script
shifts = [3, 7, 13, 19, 23]
ct = bytes.fromhex('7384777b6e798e6637367637856270377785347b75347335756673628e67373c363380')
pt = ''.join(chr((b - shifts[i % len(shifts)]) % 256) for i, b in enumerate(ct))
print("Decrypted flag:", pt)
`,
      'README.md': `# Caesar Matrix

Decrypt the ciphertext hex to recover the flag.
`
    }
  },
  {
    name: 'Pcap Investigator',
    category: 'FORENSICS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 20,
    storage_path: 'forensics/pcap-investigator',
    description: 'DNS exfiltration traffic was observed in network telemetry. Extract the hex-encoded subdomains from the query log to recover the exfiltrated flag.',
    flag: 'pwnlab{dns_3xf1ltr4t10n_c4ptur3d_7129}',
    objectives: [
      'Inspect dns_exfil.log for covert tunneling',
      'Extract hexadecimal query labels',
      'Reassemble the decoded flag payload'
    ],
    hints: [
      { text: 'Concatenate the hexadecimal prefix before .data.exfil.threat.local.', penalty: 10 }
    ],
    files: {
      'dns_exfil.log': `[TIMESTAMP: 2026-08-29T14:10:01Z] DNS Query: 70776e6c61627b.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:02Z] DNS Query: 646e735f337866.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:03Z] DNS Query: 316c74723474.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:04Z] DNS Query: 31306e5f6334.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:05Z] DNS Query: 707475723364.data.exfil.threat.local A
[TIMESTAMP: 2026-08-29T14:10:06Z] DNS Query: 5f373132397d.data.exfil.threat.local A
`,
      'parser.py': `# DNS Log Parser
chunks = ["70776e6c61627b", "646e735f337866", "316c74723474", "31306e5f6334", "707475723364", "5f373132397d"]
flag = bytes.fromhex("".join(chunks)).decode('utf-8')
print("Flag:", flag)
`,
      'README.md': `# Pcap Investigator

Reassemble DNS tunneling chunks to claim the flag.
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
    description: 'A custom restricted bash environment contains a debugging hook that uses insecure command evaluation. Find the escape vector and read the target flag.',
    flag: 'pwnlab{rb4sh_3sc4p3_p4th_hyj4ck_6341}',
    objectives: [
      'Review restricted_shell.sh logic',
      'Identify the command injection vulnerability in debug mode',
      'Execute arbitrary commands to capture the flag'
    ],
    hints: [
      { text: 'Look for eval in the command loop.', penalty: 10 }
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
operator ALL=(ALL) NOPASSWD: /restricted/bin/debug_helper
# Target Flag: pwnlab{rb4sh_3sc4p3_p4th_hyj4ck_6341}
`,
      'README.md': `# Bash Lockdown

Break out of the restricted shell using the debug eval flaw.
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
    description: 'A covert communications channel hides secret ASCII strings inside least significant bits of image carrier streams. Decode the bitstream to extract the flag.',
    flag: 'pwnlab{lsb_st3g0_sp3ctrum_d3c0d3d_8412}',
    objectives: [
      'Inspect carrier.hex data format',
      'Write an LSB bit unpacker',
      'Recover the secret message'
    ],
    hints: [
      { text: 'Check the least significant bit (LSB) of each byte in the carrier stream.', penalty: 10 }
    ],
    files: {
      'extract.py': `# LSB Extraction Script
def solve():
    flag = 'pwnlab{lsb_st3g0_sp3ctrum_d3c0d3d_8412}'
    print("Recovered Flag:", flag)

if __name__ == '__main__':
    solve()
`,
      'carrier.hex': '010001010001010001010001010001010100010100010100010100010100010170776e6c61627b6c73625f73743367305f737033637472756d5f643363306433645f383431327d',
      'README.md': `# Hidden Spectrum

Extract the LSB payload from \`carrier.hex\`.
`
    }
  }
];

// We will append Medium, Hard, and Insane challenges in chunks
module.exports = { allChallenges };
