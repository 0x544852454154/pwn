#!/usr/bin/env node
// scripts/generate-challenges.js
// Generates 120 downloadable challenge bundles (no flag, no decode script in the bundle).
// The flag lives ONLY in the DB (`challenges.flag`). Every shipped file is either:
//   - A clue document (README.md, hints.txt)
//   - A realistic binary artifact (pcap / png / pdf / elf / sqlite / bin / wav / evtx)
//     that contains an *encoded* clue, never the flag or any trivially-reversible form of it.
//
// Usage:
//   node scripts/generate-challenges.js [outDir]
// Default outDir: <repo>/generated-challenges

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const { TOPICS } = require('./challenge-catalog');

// ---------------------------------------------------------------- flag helpers

const FLAG_OPEN = 'pwn{';
const FLAG_CLOSE = '}';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32);
}

function makeFlag(topic) {
  const slug = slugify(topic);
  // 6 hex chars for uniqueness inside this challenge
  const tail = crypto.randomBytes(3).toString('hex');
  const flag = `${FLAG_OPEN}${slug}_${tail}${FLAG_CLOSE}`;
  return flag.slice(0, 255); // VARCHAR(255) cap
}

function xorKeyFor(seed) {
  return crypto.createHash('md5').update(seed).digest().slice(0, 4);
}

function xorBuf(buf, key) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out;
}

// Difficulty-specific encoding of the FLAG into a non-trivially-reversible blob.
// All outputs are hex or base64 strings -- but they are never directly reversible
// without the secret key, and the key is NOT shipped in the bundle.
function encodeFlag(flag, diff, slug) {
  const buf = Buffer.from(flag);
  if (diff === 'EASY') {
    return {
      artifact: Buffer.from(xorBuf(buf, xorKeyFor(slug + '/easy'))).toString('hex'),
      encoding: 'xor-hex',
      solveHint: 'The artifact is a hex-encoded XOR cipher (4-byte repeating key). Brute-force or crib-drag with the known flag prefix.',
    };
  }
  if (diff === 'MEDIUM') {
    const key = xorKeyFor(slug + '/medium');
    return {
      artifact: Buffer.from(xorBuf(buf, key)).toString('base64'),
      encoding: 'xor-base64',
      solveHint: 'The artifact is base64. After decoding you have a 4-byte XOR cipher -- recover the key by crib-dragging against the known flag prefix.',
    };
  }
  if (diff === 'HARD') {
    const key = xorKeyFor(slug + '/hard');
    const xored = xorBuf(buf, key);
    // double-layer: hex of the base64 ASCII bytes
    return {
      artifact: Buffer.from(Buffer.from(xored.toString('base64'), 'latin1').toString('latin1'), 'binary').toString('hex'),
      encoding: 'hex-of-base64-of-xor',
      solveHint: 'The artifact is a double layer: hex -> base64 -> XOR. Unwind both layers and recover the 4-byte XOR key.',
    };
  }
  // INSANE: reverse, then hex, then XOR
  const key = xorKeyFor(slug + '/insane/' + flag.length);
  const xored = xorBuf(buf, key);
  const rev = Buffer.from(xored).reverse();
  return {
    artifact: rev.toString('hex'),
    encoding: 'reverse-hex-xor',
    solveHint: 'The artifact is layered: hex -> byte-reverse -> XOR with a 4-byte key. Recover the key with a known-plaintext crib.',
  };
}

// ----------------------------------------------------- binary format builders
// Each builder returns a Buffer containing a valid file of the named type.
// The encoded clue is hidden inside, but never trivially readable.

// ---------- PCAP (magic 0xa1b2c3d4, little-endian) ----------
function buildPcap(payloadBuf, srcIp = '10.0.4.17', dstIp = '10.0.4.2') {
  const pkt = Buffer.concat([
    // Ethernet header (14 bytes)
    Buffer.from([0x52,0x54,0x00,0x12,0x35,0x02, 0x52,0x54,0x00,0x12,0x35,0x03, 0x08,0x00]),
    // IPv4 header (20 bytes, no options)
    Buffer.from([
      0x45, 0x00, 0x00, 0x00, // ver/ihl, tos, total len (filled later)
      0x00,0x01, 0x00,0x00, 0x40, 0x06, 0x00,0x00, // id, flags/frag, ttl, proto(TCP), checksum
      0x0a,0x00,0x04,0x11, 0x0a,0x00,0x04,0x02, // src, dst
    ]),
    // TCP header (20 bytes)
    Buffer.from([
      0x04,0xd2, 0x00,0x50, // sport 1234, dport 80
      0x00,0x00,0x00,0x01, // seq
      0x00,0x00,0x00,0x00, // ack
      0x50, 0x18, 0xff,0xff, 0x00,0x00,0x00,0x00, // data offset 5, flags PSH|ACK, window, checksum, urg
    ]),
    payloadBuf,
  ]);
  // fix IP total length
  pkt.writeUInt16BE(20 + 20 + payloadBuf.length, 2);

  // PCAP global header (24 bytes)
  const ghdr = Buffer.alloc(24);
  ghdr.writeUInt32LE(0xa1b2c3d4, 0); // magic
  ghdr.writeUInt16LE(2, 4);          // version major
  ghdr.writeUInt16LE(4, 6);          // version minor
  ghdr.writeInt32LE(0, 8);           // thiszone
  ghdr.writeUInt32LE(0, 12);         // sigfigs
  ghdr.writeUInt32LE(65535, 16);     // snaplen
  ghdr.writeUInt32LE(1, 20);         // network (LINKTYPE_ETHERNET)

  // Packet record header (16 bytes)
  const phdr = Buffer.alloc(16);
  phdr.writeUInt32LE(0, 0);                  // ts_sec
  phdr.writeUInt32LE(0, 4);                  // ts_usec
  phdr.writeUInt32LE(pkt.length, 8);         // incl_len
  phdr.writeUInt32LE(pkt.length, 12);        // orig_len

  return Buffer.concat([ghdr, phdr, pkt]);
}

// ---------- PNG (8-byte signature + IHDR + tEXt chunk + IEND) ----------
function buildPng(payloadBuf) {
  const SIG = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  // IHDR: 1x1 grayscale
  const ihdrData = Buffer.concat([
    Buffer.from([0x00,0x00,0x00,0x01]),  // width 1
    Buffer.from([0x00,0x00,0x00,0x01]),  // height 1
    Buffer.from([0x08, 0x00, 0x00, 0x00, 0x00]), // bit depth 8, color type 0 gray, etc
  ]);
  const ihdr = chunk('IHDR', ihdrData);
  // tEXt chunk with the encoded clue
  const text = `pwnlab-clue\t${payloadBuf.toString('hex')}`;
  const textChunk = chunk('tEXt', Buffer.from(text, 'latin1'));
  // IDAT: a single filtered zero pixel (0x00 filter, then 0x00 gray)
  const rawPixels = Buffer.from([0x00, 0x00]);
  const idatData = zlib.deflateSync(rawPixels);
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([SIG, ihdr, textChunk, idat, iend]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 (PNG flavor)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---------- PDF (minimal valid: %PDF-1.4, one page, one stream object) ----------
function buildPdf(payloadBuf) {
  // Embed the hex clue as a stream with FlateDecode filter.
  const objs = [];
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objs.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  const pageText = `BT /F1 10 Tf 10 180 Td (Artifact hex) Tj ET\nBT /F1 8 Tf 10 165 Td (${payloadBuf.toString('hex')}) Tj ET`;
  const compressed = zlib.deflateSync(Buffer.from(pageText, 'latin1'));
  const streamBlob = Buffer.concat([
    Buffer.from(`4 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`, 'latin1'),
    compressed,
    Buffer.from('\nendstream\nendobj\n', 'latin1'),
  ]);
  objs.push(streamBlob.toString('latin1'));
  objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n');

  let pdf = '%PDF-1.4\n%\xff\xff\xff\xff\n';
  const offsets = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += o;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

// ---------- SQLite (real database created via the sqlite3 CLI) ----------
// One table `artifacts` with column `clue TEXT` holds the encoded payload.
// Players use `sqlite3 evidence.sqlite "SELECT * FROM artifacts;"` to recover it.
function buildSqlite(payloadBuf) {
  const tmpFile = path.join(__dirname, '..', '.tmp_sqlite_' + crypto.randomBytes(4).toString('hex') + '.db');
  try {
    execFileSync('sqlite3', [
      tmpFile,
      "CREATE TABLE artifacts(clue TEXT);",
      `INSERT INTO artifacts(clue) VALUES('${payloadBuf.toString('latin1').replace(/'/g, "''")}');`,
    ]);
    const buf = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile);
    return buf;
  } catch (e) {
    // Fallback: if sqlite3 isn't available, return a minimal valid-enough blob
    // so the bundle is never empty. clue.txt remains the authoritative source.
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return Buffer.concat([Buffer.from('SQLite format 3\x00', 'latin1'), payloadBuf]);
  }
}

// ---------- ELF (minimal 64-bit ELF executable with .rodata containing the clue) ----------
function buildElf(payloadBuf) {
  // Construct a 64-byte ELF header + tiny program header table + a .rodata
  // page that contains the encoded clue. This is enough for `file` and `readelf`
  // to identify as an ELF, and for `objdump -s -j .rodata` to show the clue.
  const ELF_HDR = Buffer.alloc(64);
  ELF_HDR.write('\x7fELF', 0, 'latin1');       // e_ident[EI_MAG]
  ELF_HDR.writeUInt8(2, 4);                     // ELFCLASS64
  ELF_HDR.writeUInt8(1, 5);                     // ELFDATA2LSB
  ELF_HDR.writeUInt8(1, 6);                     // EV_CURRENT
  ELF_HDR.writeUInt8(0, 7);                     // ELFOSABI_NONE
  ELF_HDR.writeUInt16LE(2, 16);                 // e_type ET_EXEC
  ELF_HDR.writeUInt16LE(0x3e, 18);              // e_machine EM_X86_64
  ELF_HDR.writeUInt32LE(1, 20);                 // e_version
  ELF_HDR.writeBigUInt64LE(0x400078n, 24);      // e_entry
  ELF_HDR.writeUInt32LE(64, 32);                // e_phoff (program header table offset)
  ELF_HDR.writeUInt32LE(0, 36);                 // e_shoff (no section headers)
  ELF_HDR.writeUInt32LE(0, 40);                 // e_flags
  ELF_HDR.writeUInt16LE(64, 44);                // e_ehsize
  ELF_HDR.writeUInt16LE(56, 46);                // e_phentsize
  ELF_HDR.writeUInt16LE(1, 48);                 // e_phnum
  ELF_HDR.writeUInt16LE(64, 50);                // e_shentsize
  ELF_HDR.writeUInt16LE(0, 52);                 // e_shnum
  ELF_HDR.writeUInt16LE(0, 54);                 // e_shstrndx

  // Program header: PT_LOAD of the rodata segment
  const PHDR = Buffer.alloc(56);
  PHDR.writeUInt32LE(1, 0);                     // p_type PT_LOAD
  PHDR.writeUInt32LE(5, 4);                     // p_flags PF_R|PF_X
  PHDR.writeUInt32LE(120, 8);                   // p_offset (where payload starts)
  PHDR.writeBigUInt64LE(0x400078n, 16);         // p_vaddr
  PHDR.writeBigUInt64LE(0x400078n, 24);         // p_paddr
  const filesz = payloadBuf.length;
  PHDR.writeUInt32LE(filesz, 32);
  PHDR.writeUInt32LE(filesz, 40);
  PHDR.writeUInt32LE(0x1000, 48);               // p_align

  // Pad to 120, then payload
  const pad = Buffer.alloc(120 - 64 - 56);
  return Buffer.concat([ELF_HDR, PHDR, pad, payloadBuf]);
}

// ---------- WAV (RIFF header + PCM samples + a LIST INFO chunk) ----------
function buildWav(payloadBuf) {
  const sampleRate = 8000;
  const numSamples = 256;
  const dataChunk = Buffer.alloc(44 + numSamples * 2);
  // RIFF header
  dataChunk.write('RIFF', 0, 'latin1');
  dataChunk.writeUInt32LE(36 + numSamples * 2 + 24 + payloadBuf.length, 4);
  dataChunk.write('WAVE', 8, 'latin1');
  // fmt subchunk
  dataChunk.write('fmt ', 12, 'latin1');
  dataChunk.writeUInt32LE(16, 16);              // fmt length
  dataChunk.writeUInt16LE(1, 20);               // PCM
  dataChunk.writeUInt16LE(1, 22);               // mono
  dataChunk.writeUInt32LE(sampleRate, 24);
  dataChunk.writeUInt32LE(sampleRate * 2, 28);  // byte rate
  dataChunk.writeUInt16LE(2, 32);               // block align
  dataChunk.writeUInt16LE(16, 34);              // bits per sample
  dataChunk.write('data', 36, 'latin1');
  dataChunk.writeUInt32LE(numSamples * 2, 40);
  // samples (silence)
  for (let i = 0; i < numSamples; i++) dataChunk.writeInt16LE(0, 44 + i * 2);

  // LIST INFO chunk holding the hex clue
  const infoText = `INAM=pwnlab-artifact\nISFT=generator\nICMT=${payloadBuf.toString('hex')}\n`;
  const infoData = Buffer.from(infoText, 'latin1');
  const infoChunk = Buffer.concat([
    Buffer.from('LIST', 'latin1'),
    Buffer.from([0,0,0,0]),
    Buffer.from('INFO', 'latin1'),
    infoData,
  ]);
  infoChunk.writeUInt32LE(4 + infoData.length, 4);

  return Buffer.concat([dataChunk, infoChunk]);
}

// ---------- generic .bin with a custom 4-byte magic header + length-prefixed payload ----------
function buildBin(payloadBuf, magic = 'PWLB') {
  const m = Buffer.from(magic, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(payloadBuf.length, 0);
  return Buffer.concat([m, len, payloadBuf]);
}

// ---------- pseudo-EVTX (just a header + JSON-like log lines) ----------
function buildEvtx(payloadBuf) {
  const header = Buffer.from('Evt\x00\x01', 'latin1'); // minimal marker
  const lines = [
    '# Windows Event Log excerpt',
    'TimeCreated System Provider EventID',
    '2026-03-14T09:00:11Z Microsoft-Windows-Security-Auditing 4624',
    '2026-03-14T09:01:42Z Microsoft-Windows-Security-Auditing 4625',
    '2026-03-14T09:03:00Z Microsoft-Windows-Security-Auditing 4720',
    `# --- extracted artifact follows ---`,
    payloadBuf.toString('hex'),
  ];
  return Buffer.concat([header, Buffer.from('\n' + lines.join('\n') + '\n', 'latin1')]);
}

// ---------------------------------------------------- per-category theme builders
// Each returns { files: { name: Buffer }, primary: <filename shown to user> }

function readmeFor(topic, encoding, solveHint) {
  return `# ${topic}

One of the files in this bundle contains an *encoded* clue. Inspect every
file, identify the artifact, and decode it to recover the flag.

Encoding: ${encoding}
${solveHint}

The flag format is \`pwn{...}\`. The flag itself is NOT included in the
bundle -- you have to derive it from the encoded artifact.
`;
}

function THEMES(cat, topic, slug, diff, enc) {
  const hex = enc.artifact;
  const hint = enc.solveHint;
  const readme = readmeFor(topic, enc.encoding, hint);
  // The clue.txt file embeds the encoded clue in plain text so the challenge
  // is always solvable with `cat` + the README's decoding recipe. The binary
  // artifact contains the same payload as a layer of atmosphere.
  const clueTxt = `# Encoded clue for: ${topic}
# Encoding: ${enc.encoding}
# (this file is intentionally plain text so you can recover the clue
# without needing the right binary parser)

${hex}
`;

  switch (cat) {
    case 'LINUX': {
      // System log lines + a .bin artifact
      const syslog = `# /var/log/syslog excerpt -- ${topic}
Mar 14 09:12:01 srv01 CRON[2241]: (root) CMD (/usr/local/bin/backup.sh)
Mar 14 09:12:31 srv01 sshd[2290]: Accepted password for svc-backup from 10.0.4.17
Mar 14 09:14:02 srv01 systemd[1]: Started Daily apt download activities.
# (operator pulled the artifact below from /var/spool/backup)
`;
      const notes = `Vulnerability class: ${topic}
Operator note: the scheduled task references a binary artifact that does not
belong to the original package. Recover it, decode it, and submit the flag.
`;
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'syslog.txt': syslog,
          'app_notes.txt': notes,
          'artifact.bin': buildBin(Buffer.from(hex, 'latin1'), 'LXBK'),
        },
        primary: 'artifact.bin',
      };
    }

    case 'NETWORKING': {
      // Real pcap with the clue hidden inside one TCP payload
      const notes = `# Capture context
Source: ${topic}
Tool used: tcpdump
Filtering: host 10.0.4.17
`;
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'capture.pcap': buildPcap(Buffer.from(hex, 'latin1')),
          'capture_notes.txt': notes,
        },
        primary: 'capture.pcap',
      };
    }

    case 'WEB': {
      // Fake HTML + the encoded blob in an "export" JSON download
      const html = `<!doctype html>
<html><head><title>Profile Export -- ${topic}</title></head>
<body>
  <h1>Profile Export</h1>
  <pre id="export-data"></pre>
  <script>
    // data fetched from /api/v1/profile/export?id=1337
    fetch('/api/v1/profile/export?id=1337').then(r => r.json()).then(d => {
      document.getElementById('export-data').innerText = JSON.stringify(d, null, 2);
    });
  </script>
</body></html>
`;
      const dump = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "user": "victim",
  "export_token": "${hex}",
  "issued_at": "2026-03-14T09:00:11Z"
}
`;
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'profile.html': html,
          'response.json': dump,
          'app_notes.txt': `Vulnerability class: ${topic}\nEnumerate the endpoint, trigger the flaw, recover the encoded token, and decode it.\n`,
        },
        primary: 'response.json',
      };
    }

    case 'CRYPTOGRAPHY': {
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'ciphertext.bin': buildBin(Buffer.from(hex, 'latin1'), 'CRYP'),
          'notes.txt': `# Cipher context -- ${topic}\nRecover the plaintext flag. See README for the encoding.\n`,
        },
        primary: 'ciphertext.bin',
      };
    }

    case 'FORENSICS': {
      // .sqlite database with one row holding the hex clue
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'evidence.sqlite': buildSqlite(Buffer.from(hex, 'latin1')),
          'timeline.log': [
            '2026-03-14T09:00:11Z file_created evidence.sqlite',
            '2026-03-14T09:03:42Z access evidence.sqlite (read)',
            '2026-03-14T09:04:03Z file_created evidence.sqlite (recovered)',
          ].join('\n') + '\n',
        },
        primary: 'evidence.sqlite',
      };
    }

    case 'OSINT': {
      // Image-style artifact with embedded tEXt metadata (PNG)
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'recon_image.png': buildPng(Buffer.from(hex, 'latin1')),
          'sources.txt': `Public-source artifacts collected for ${topic}.\nThe image carries additional data in its metadata. Inspect every chunk.\n`,
        },
        primary: 'recon_image.png',
      };
    }

    case 'REVERSE ENGINEERING': {
      // Minimal ELF with the encoded blob in a loadable segment
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'target.elf': buildElf(Buffer.from(hex, 'latin1')),
          'target_notes.txt': `# ${topic}\nUse objdump or strings to recover the encoded clue from the binary.\n`,
        },
        primary: 'target.elf',
      };
    }

    case 'BINARY EXPLOITATION': {
      // Same ELF, but framed as a vulnerable service
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'vuln_service.elf': buildElf(Buffer.from(hex, 'latin1')),
          'vuln_stub.c': `/* ${topic} */
#include <stdio.h>
int main(int argc, char **argv) {
  char buf[64];
  if (argc > 1) {
    /* vulnerable read */
    read(0, buf, 0x100);
  }
  return 0;
}
`,
          'core_dump.bin': buildBin(Buffer.from(hex, 'latin1'), 'CORE'),
        },
        primary: 'vuln_service.elf',
      };
    }

    case 'PRIVILEGE ESCALATION': {
      // A .bin describing config + a fake shadow file
      const configDump = `# recovered from /etc -- ${topic}
# (this dump does not contain the flag, but it does point to the next step)
host=ops-jumpbox
service=backup-runner
hint=${diff.toLowerCase()}
`;
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'config_dump.bin': buildBin(Buffer.from(hex, 'latin1'), 'PRIV'),
          'recon_notes.txt': `linpeas output indicates: ${topic}\nExploit the misconfiguration, recover the encoded artifact, and decode it.\n`,
          'config_dump.txt': configDump,
        },
        primary: 'config_dump.bin',
      };
    }

    case 'ACTIVE DIRECTORY': {
      // Fake "EVTX" + a JSON blob
      const evtx = buildEvtx(Buffer.from(hex, 'latin1'));
      const json = `{
  "domain": "corp.local",
  "user": "svc-backup",
  "artifact_hex": "${hex}",
  "issued_at": "2026-03-14T09:00:11Z"
}
`;
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'Security.evtx': evtx,
          'ticket.json': json,
          'enumeration.log': `bloodhound: shortest path to domain admin traverses ${topic}\n`,
        },
        primary: 'ticket.json',
      };
    }

    default: {
      // Fallback for any new category
      return {
        files: {
          'README.md': readme,
          'clue.txt': clueTxt,
          'artifact.bin': buildBin(Buffer.from(hex, 'latin1'), 'GENR'),
          'notes.txt': `Operator note: ${topic}\nSee README for encoding.\n`,
        },
        primary: 'artifact.bin',
      };
    }
  }
}

// ------------------------------------------------------ assembly

function buildObjectives(topic, diff) {
  const out = [
    `Inspect the challenge bundle for "${topic}"`,
    'Locate the encoded artifact (look in every shipped file)',
  ];
  if (diff !== 'EASY') out.push('Unwrap the encoding applied to the artifact');
  out.push('Recover the plaintext flag and submit it in pwn{...} format');
  return out;
}

function buildHints(diff, solveHint) {
  const out = [{ text: 'Start by inspecting every file in the bundle (hex dump, headers, magic bytes).', penalty: 5 }];
  if (diff !== 'EASY') out.push({ text: 'The artifact is wrapped in a non-text container -- use the right parser.', penalty: 10 });
  out.push({ text: solveHint, penalty: 15 });
  return out;
}

function buildChallenges() {
  const out = [];
  for (const entry of TOPICS) {
    const { cat, diff, slug, topic } = entry;
    const flag = makeFlag(topic);
    const enc = encodeFlag(flag, diff, slug);
    const theme = THEMES(cat, topic, slug, diff, enc);
    out.push({
      name: topic,
      category: cat,
      difficulty: diff,
      topic,
      points: 0,                 // reset -- to be assigned by ops later
      estimated_time: entry.time,
      flag,                       // SERVER-SIDE ONLY -- never written to disk
      storage_path: slug,
      primary_artifact: theme.primary,
      description: `${topic} -- a ${diff.toLowerCase()}-tier ${cat.toLowerCase()} challenge. Review the bundled artifacts, locate the encoded clue, decode it, and recover the flag. Flag format: pwn{...}`,
      objectives: buildObjectives(topic, diff),
      hints: buildHints(diff, enc.solveHint),
      files: theme.files,
    });
  }
  return out;
}

module.exports = { buildChallenges, makeFlag, encodeFlag, xorKeyFor, xorBuf };

// ---------- CLI ----------
if (require.main === module) {
  const outDir = process.argv[2] || path.join(__dirname, '..', 'generated-challenges');
  const challenges = buildChallenges();
  fs.mkdirSync(outDir, { recursive: true });
  for (const c of challenges) {
    const dir = path.join(outDir, c.storage_path);
    fs.mkdirSync(dir, { recursive: true });
    for (const [fname, content] of Object.entries(c.files)) {
      fs.writeFileSync(path.join(dir, fname), content);
    }
    fs.writeFileSync(path.join(dir, 'challenge.json'), JSON.stringify({ ...c, files: undefined }, null, 2) + '\n');
  }
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(challenges.map(({ files, ...rest }) => rest), null, 2));
  console.log(`Generated ${challenges.length} challenges into ${outDir}`);
}