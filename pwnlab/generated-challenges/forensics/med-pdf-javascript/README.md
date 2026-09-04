# PDF format stream analysis with hidden JavaScript payload

One of the files in this bundle contains an *encoded* clue. Inspect every
file, identify the artifact, and decode it to recover the flag.

Encoding: xor-base64
The artifact is base64. After decoding you have a 4-byte XOR cipher -- recover the key by crib-dragging against the known flag prefix.

The flag format is `pwn{...}`. The flag itself is NOT included in the
bundle -- you have to derive it from the encoded artifact.
