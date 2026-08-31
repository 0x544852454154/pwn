#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    system("service nginx status"); // Relative path vulnerable to PATH hijack
    return 0;
}
