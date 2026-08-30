#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>

const unsigned char flag_bytes[] = {
    0x23, 0x24, 0x2d, 0x2f, 0x32, 0x31, 0x28, 0x20,
    0x26, 0x62, 0x37, 0x0c, 0x27, 0x63, 0x36, 0x2c,
    0x0c, 0x21, 0x67, 0x30, 0x0c, 0x23, 0x21, 0x62,
    0x60, 0x20, 0x30, 0x0c, 0x64, 0x67, 0x63, 0x62,
    0x2e
};

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    char *path = argv[1];

    struct stat st;
    if (stat(path, &st) == 0) {
        // TOCTOU Window
        usleep(1000);
        int fd = open(path, O_RDWR);
        if (fd >= 0) {
            for (size_t i = 0; i < sizeof(flag_bytes); i++) {
                char c = flag_bytes[i] ^ 0x53;
                write(fd, &c, 1);
            }
            close(fd);
        }
    }
    return 0;
}
