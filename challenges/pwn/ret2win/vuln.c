#include <stdio.h>
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
    putchar('\n');
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
