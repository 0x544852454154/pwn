// ARM Thumb-2 Decryption Routine
.thumb
.global decrypt_flag
decrypt_flag:
    ldr r0, =enc_data
    ldr r1, =out_buf
loop:
    ldrb r2, [r0], #1
    cmp r2, #0
    beq done
    eor r2, r2, #0x55
    strb r2, [r1], #1
    b loop
done:
    bx lr
