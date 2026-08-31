import hashlib
SALT = b"pwnlab_salt_"
TARGET = "cfa57e932bd4cd7cf69c24e3c312d16005d51bd961bda2f912c344f9fa6de238"
for pin in range(1000, 10000):
    if hashlib.sha256(SALT + str(pin).encode()).hexdigest() == TARGET:
        print(f"pwn{{sh4d0w_p1n_cr4ck3d_{pin}}}")
        break
