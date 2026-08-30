#include <stdio.h>
#include <stdlib.h>

void *ptrs[10];

void allocate(int idx, int size) {
    ptrs[idx] = malloc(size);
}

void deallocate(int idx) {
    // Missing ptrs[idx] = NULL -> Double Free
    free(ptrs[idx]);
}

int main() {
    puts("pwnlab Fastbin Heap Manager");
    return 0;
}
