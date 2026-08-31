#include <stdio.h>
#include <stdlib.h>

void win() {
    printf("pwn{r3t2w1n_st4ck_0v3rfl0w_pwn3d_5912}\n");
}

void vuln() {
    char buf[32];
    gets(buf); // Overwrite RIP at offset 40
}

int main() {
    vuln();
    return 0;
}
