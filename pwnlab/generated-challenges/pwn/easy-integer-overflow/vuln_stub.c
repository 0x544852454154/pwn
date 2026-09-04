/* Integer overflow leading to out-of-bounds array access */
#include <stdio.h>
int main(int argc, char **argv) {
  char buf[64];
  if (argc > 1) {
    /* vulnerable read */
    read(0, buf, 0x100);
  }
  return 0;
}
