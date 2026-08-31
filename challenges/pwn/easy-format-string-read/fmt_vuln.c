#include <stdio.h>

int main() {
    char flag[] = "pwn{f0rm4t_str1ng_st4ck_l34k_3391}";
    char buf[64];
    fgets(buf, sizeof(buf), stdin);
    printf(buf); // Vulnerable
    return 0;
}
