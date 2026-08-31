#include <stdio.h>

int main() {
    unsigned short size = 65520;
    if ((unsigned short)(size + 16) < 16) {
        printf("pwn{1nt3g3r_0v3rfl0w_wr4p_4910}\n");
    }
    return 0;
}
