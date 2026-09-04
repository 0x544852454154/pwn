/* Modern glibc 2.35+ heap exploitation (house of apple / FSOP stdout vtable hijacking) */
#include <stdio.h>
int main(int argc, char **argv) {
  char buf[64];
  if (argc > 1) {
    /* vulnerable read */
    read(0, buf, 0x100);
  }
  return 0;
}
