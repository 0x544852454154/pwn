# Zero-window TCP sequence number steganography covert data reconstruction

One of the files in this bundle contains an *encoded* clue. Inspect every
file, identify the artifact, and decode it to recover the flag.

Encoding: reverse-hex-xor
The artifact is layered: hex -> byte-reverse -> XOR with a 4-byte key. Recover the key with a known-plaintext crib.

The flag format is `pwn{...}`. The flag itself is NOT included in the
bundle -- you have to derive it from the encoded artifact.
