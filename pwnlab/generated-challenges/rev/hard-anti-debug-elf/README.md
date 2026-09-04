# Anti-debugging techniques (ptrace, timing checks) in stripped ELF

One of the files in this bundle contains an *encoded* clue. Inspect every
file, identify the artifact, and decode it to recover the flag.

Encoding: hex-of-base64-of-xor
The artifact is a double layer: hex -> base64 -> XOR. Unwind both layers and recover the 4-byte XOR key.

The flag format is `pwn{...}`. The flag itself is NOT included in the
bundle -- you have to derive it from the encoded artifact.
