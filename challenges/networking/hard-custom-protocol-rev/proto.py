# Protocol Specification
import struct
# Header: MAGIC(2B) + SEQ(2B) + LEN(2B) + CRC32(4B) + RC4_PAYLOAD(LEN)
MAGIC = b"\x50\x57"
