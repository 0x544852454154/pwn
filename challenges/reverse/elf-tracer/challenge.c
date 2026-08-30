#include <stdio.h>
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
        printf("Usage: %s <key>\n", argv[0]);
        return 1;
    }
    if (validate(argv[1])) {
        printf("Access Granted! Flag: %s\n", argv[1]);
    } else {
        puts("Access Denied.");
    }
    return 0;
}
