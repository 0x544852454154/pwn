# Public code repository commit history and leaked secret scanning

One of the files in this bundle contains an *encoded* clue. Inspect every
file, identify the artifact, and decode it to recover the flag.

Encoding: xor-hex
The artifact is a hex-encoded XOR cipher (4-byte repeating key). Brute-force or crib-drag with the known flag prefix.

The flag format is `pwn{...}`. The flag itself is NOT included in the
bundle -- you have to derive it from the encoded artifact.
