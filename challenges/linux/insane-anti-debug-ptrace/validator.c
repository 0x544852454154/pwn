// Ptrace Protected Validator Stub
#include <sys/ptrace.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int main() {
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        printf("Debugger detected! Aborting.\n");
        return 1;
    }
    // Hidden flag encoded with modular arithmetic:
    // enc[i] = (flag[i] * 7 + 13) % 256
    return 0;
}
