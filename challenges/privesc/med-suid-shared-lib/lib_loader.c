// SUID Binary with RPATH=/var/tmp
#include <stdio.h>
#include <dlfcn.h>

int main() {
    void *h = dlopen("libcustom.so", RTLD_LAZY);
    return 0;
}
