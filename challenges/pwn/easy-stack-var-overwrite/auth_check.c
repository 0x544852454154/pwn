#include <stdio.h>
#include <string.h>

void win() {
    printf("pwn{st4ck_v4r_0v3rwr1t3_pwn3d_8192}\n");
}

int main() {
    volatile int is_admin = 0;
    char buffer[32];
    gets(buffer);
    if (is_admin != 0) win();
    else printf("Access Denied.\n");
    return 0;
}
