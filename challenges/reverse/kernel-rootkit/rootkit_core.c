#include <linux/module.h>
#include <linux/kernel.h>

int init_module(void) {
    pr_info("pwnlab kernel rootkit active\n");
    return 0;
}
