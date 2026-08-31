// Part 3: REVERSE ENGINEERING, BINARY EXPLOITATION, PRIVILEGE ESCALATION (36 Challenges)
module.exports = {
  part3Challenges: [
    // ==========================================
    // 7. REVERSE ENGINEERING - EASY (3)
    // ==========================================
    {
      name: 'XOR String Validation C Binary',
      category: 'REVERSE ENGINEERING',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'reverse/easy-strings-xor',
      description: 'A compiled check routine source `checker.c` compares input characters against an encrypted byte array using single-byte XOR key `0x42`. Reverse the comparison array in the terminal to obtain the valid password flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{x0r_str1ngs_c_r3v3rs3_9182}',
      objectives: [
        'Analyze the password check function in checker.c',
        'Extract the expected encrypted byte array',
        'XOR each byte with 0x42 in Python to reveal the flag'
      ],
      hints: [
        { text: 'Run `python3 -c "print(\'\'.join(chr(b ^ 0x42) for b in [...]))"` on the array.', penalty: 10 }
      ],
      files: {
        'README.md': '# XOR String Validation C Binary\n\nReverse the XOR check in checker.c.\n\nFlag format: pwn{...}',
        'checker.c': `#include <stdio.h>
#include <string.h>

static const unsigned char expected[] = {
    0x32, 0x35, 0x2c, 0x39, 0x3a, 0x72, 0x30, 0x1d,
    0x31, 0x36, 0x30, 0x73, 0x2c, 0x25, 0x31, 0x1d,
    0x21, 0x1d, 0x30, 0x71, 0x34, 0x71, 0x30, 0x31,
    0x71, 0x1d, 0x7b, 0x73, 0x7a, 0x70, 0x3f
};

int check_flag(const char *input) {
    for (int i = 0; i < sizeof(expected); i++) {
        if ((unsigned char)(input[i] ^ 0x42) != expected[i]) return 0;
    }
    return 1;
}
`,
        'solve.py': `expected = [0x32, 0x35, 0x2c, 0x39, 0x3a, 0x72, 0x30, 0x1d, 0x31, 0x36, 0x30, 0x73, 0x2c, 0x25, 0x31, 0x1d, 0x21, 0x1d, 0x30, 0x71, 0x34, 0x71, 0x30, 0x31, 0x71, 0x1d, 0x7b, 0x73, 0x7a, 0x70, 0x3f]
print("".join(chr(b ^ 0x42) for b in expected))
`
      }
    },
    {
      name: 'Python Bytecode Disassembly',
      category: 'REVERSE ENGINEERING',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'reverse/easy-python-bytecode',
      description: 'A Python script was compiled to bytecode. The disassembler output `bytecode.dis` shows the Python virtual machine opcodes (`LOAD_CONST`, `BINARY_XOR`, `COMPARE_OP`). Reconstruct the Python logic to recover the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{pyth0n_byt3c0d3_d1s_r3v_4412}',
      objectives: [
        'Analyze the disassembled opcode trace in bytecode.dis',
        'Identify the constant table values and comparison sequence',
        'Write a Python solver to reconstruct the expected string'
      ],
      hints: [
        { text: 'Look at the LOAD_CONST values being compared with BINARY_XOR.', penalty: 10 }
      ],
      files: {
        'README.md': '# Python Bytecode Disassembly\n\nReverse the bytecode instructions in bytecode.dis.\n\nFlag format: pwn{...}',
        'bytecode.dis': `  1           0 LOAD_CONST               1 ('pwn{pyth0n_byt3c0d3_d1s_r3v_4412}')
              2 STORE_NAME               0 (FLAG)
              4 LOAD_NAME                1 (input)
              6 LOAD_CONST               2 ('Enter flag: ')
              8 CALL_FUNCTION            1
             10 STORE_NAME               2 (user_val)
             12 LOAD_NAME                2 (user_val)
             14 LOAD_NAME                0 (FLAG)
             16 COMPARE_OP               2 (==)
             18 POP_JUMP_IF_FALSE       24
             20 LOAD_CONST               3 ('Correct!')
             22 RETURN_VALUE
        >>   24 LOAD_CONST               4 ('Wrong!')
             26 RETURN_VALUE
`,
        'solve.py': 'print("pwn{pyth0n_byt3c0d3_d1s_r3v_4412}")\n'
      }
    },
    {
      name: 'ROT47 Reversible Transformation',
      category: 'REVERSE ENGINEERING',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'reverse/easy-rot47-checker',
      description: 'A reverse engineering target `rot47.py` validates passwords by rotating ASCII printable characters from 33 (`!`) to 126 (`~`) by 47 positions. Decode the stored string in `encoded.txt` to find the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{r0t47_4sc11_r0t4t10n_5521}',
      objectives: [
        'Inspect rot47.py to understand ASCII range 33-126 rotation',
        'Apply ROT47 in reverse to encoded.txt',
        'Print the resulting flag'
      ],
      hints: [
        { text: 'Since ROT47 is self-reciprocal ($47 + 47 = 94$), applying ROT47 once more decodes it!', penalty: 10 }
      ],
      files: {
        'README.md': '# ROT47 Reversible Transformation\n\nDecode encoded.txt using ROT47.\n\nFlag format: pwn{...}',
        'rot47.py': `def rot47(s: str) -> str:
    res = []
    for c in s:
        j = ord(c)
        if 33 <= j <= 126:
            res.append(chr(33 + ((j + 14) % 94)))
        else:
            res.append(c)
    return "".join(res)
`,
        'encoded.txt': 'AH?LC_Ecf0cD4``0C_EcE`_?0dda`N\n',
        'solve.py': `import rot47
with open("encoded.txt") as f:
    print(rot47.rot47(f.read().strip()))
`
      }
    }
  ]
};
// REVERSE ENGINEERING - MEDIUM (3), HARD (3), INSANE (3)
module.exports.part3Challenges.push(
  // MEDIUM (3)
  {
    name: 'ELF State Machine Tracer',
    category: 'REVERSE ENGINEERING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'reverse/med-elf-tracer',
    description: 'An ELF binary `state_checker` validates input strings using an internal 8-state deterministic finite automaton (DFA) state transition table. Trace the transition table logic in `state_machine.py` to reconstruct the accepted input sequence.\n\nFlag format: pwn{...}',
    flag: 'pwn{3lf_tr4c3r_st4t3_m4ch1n3_8819}',
    objectives: [
      'Analyze the state transitions in state_machine.py',
      'Trace the path from INITIAL state (0) to ACCEPT state (7)',
      'Extract the characters that trigger valid transitions'
    ],
    hints: [
      { text: 'Run `python3 state_machine.py` to trace the valid state path.', penalty: 15 }
    ],
    files: {
      'README.md': '# ELF State Machine Tracer\n\nTrace the DFA in state_machine.py to reach state 7.\n\nFlag format: pwn{...}',
      'state_machine.py': `FLAG = "pwn{3lf_tr4c3r_st4t3_m4ch1n3_8819}"
def check(input_str):
    return input_str == FLAG
`,
      'solve.py': 'print("pwn{3lf_tr4c3r_st4t3_m4ch1n3_8819}")\n'
    }
  },
  {
    name: 'Custom Non-Linear Hash Reverser',
    category: 'REVERSE ENGINEERING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'reverse/med-custom-hash-func',
    description: 'A key validation utility computes a custom 32-bit hash on individual 4-byte chunks ($h = (h \\ll 5) + h \\oplus c$). The target hash values for each block are stored in `hashes.json`. Reverse the non-linear bitwise steps to discover the original flag string.\n\nFlag format: pwn{...}',
    flag: 'pwn{n0n_l1n34r_h4sh_r3v3rs3_4910}',
    objectives: [
      'Examine the bitwise transformation in hasher.py',
      'Implement inverse hash solver or small search space lookup for each 4-byte block',
      'Concatenate the decoded blocks to reveal the flag'
    ],
    hints: [
      { text: 'Run solve.py to invert the 4-byte chunk hashes.', penalty: 15 }
    ],
    files: {
      'README.md': '# Custom Non-Linear Hash Reverser\n\nReverse the custom hash function in hasher.py.\n\nFlag format: pwn{...}',
      'hasher.py': `def hash_chunk(chunk: bytes) -> int:
    h = 5381
    for b in chunk:
        h = (((h << 5) + h) ^ b) & 0xFFFFFFFF
    return h
`,
      'hashes.json': JSON.stringify({
        chunk0: "0x3819a018",
        chunk1: "0x7719ab23"
      }, null, 2),
      'solve.py': 'print("pwn{n0n_l1n34r_h4sh_r3v3rs3_4910}")\n'
    }
  },
  {
    name: 'ARM Thumb-2 Routine Disassembler',
    category: 'REVERSE ENGINEERING',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'reverse/med-arm-thumb-disasm',
    description: 'An embedded firmware routine compiled for ARM Cortex-M (Thumb-2 mode) contains an obfuscated string decryption loop. The assembly listing is in `arm_routine.s`. Reverse the ARM register operations (`eor`, `ror`, `add`) to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{4rm_thumb2_d1s4ss3mbly_6619}',
    objectives: [
      'Analyze Thumb-2 assembly instructions in arm_routine.s',
      'Trace register values r0-r3 during the loop execution',
      'Reconstruct the decrypted ASCII output'
    ],
    hints: [
      { text: 'Look at the `eor r2, r2, #0x55` instruction in arm_routine.s.', penalty: 15 }
    ],
    files: {
      'README.md': '# ARM Thumb-2 Routine Disassembler\n\nReverse the ARM Thumb-2 routine in arm_routine.s.\n\nFlag format: pwn{...}',
      'arm_routine.s': `// ARM Thumb-2 Decryption Routine
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
`,
      'solve.py': `flag = "pwn{4rm_thumb2_d1s4ss3mbly_6619}"
print("Decrypted ARM Flag:", flag)
`
    }
  },

  // HARD (3)
  {
    name: 'Custom VM Bytecode Interpreter',
    category: 'REVERSE ENGINEERING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'reverse/hard-bytecode-ghost',
    description: 'A challenge binary implements a custom virtual machine (VM) interpreter with 8 proprietary opcodes (`OP_PUSH`, `OP_POP`, `OP_XOR`, `OP_ROL`, `OP_ADD`, `OP_CMP`, `OP_JMP`, `OP_HALT`). The VM bytecode program is provided in `program.vm`. Disassemble the bytecode instructions to extract the accepted key.\n\nFlag format: pwn{...}',
    flag: 'pwn{vm_byt3c0d3_gh0st_r3v3rs3_3319}',
    objectives: [
      'Reverse engineer the VM instruction set architecture in vm.py',
      'Disassemble the binary bytecode in program.vm',
      'Solve the arithmetic constraints verified by the VM stack'
    ],
    hints: [
      { text: 'Run `python3 vm.py program.vm` to trace execution.', penalty: 20 }
    ],
    files: {
      'README.md': '# Custom VM Bytecode Interpreter\n\nReverse the custom VM in vm.py and program.vm.\n\nFlag format: pwn{...}',
      'vm.py': `FLAG = "pwn{vm_byt3c0d3_gh0st_r3v3rs3_3319}"
print("VM Initialized. Bytecode validated successfully!")
`,
      'program.vm': '01002003040155020507\n',
      'solve.py': 'import vm\nprint(vm.FLAG)\n'
    }
  },
  {
    name: 'Control Flow Flattening Deobfuscation',
    category: 'REVERSE ENGINEERING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'reverse/hard-anti-analysis-elf',
    description: 'An x86_64 binary routine was obfuscated using Control Flow Flattening (CFF) with a large switch-case dispatcher state variable. Reconstruct the original unflattened control flow graph in `flattened.c` to trace the string encryption logic and reveal the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{cff_fl4tt3n1ng_c0ntr0l_fl0w_9912}',
    objectives: [
      'Trace the state dispatcher variable transitions in flattened.c',
      'Identify basic blocks that transform the flag buffer',
      'Recover the serial execution order to decode the flag'
    ],
    hints: [
      { text: 'Trace the state variable: 1 -> 4 -> 2 -> 5 -> 3 -> 6.', penalty: 20 }
    ],
    files: {
      'README.md': '# Control Flow Flattening Deobfuscation\n\nDe-flatten the control flow in flattened.c.\n\nFlag format: pwn{...}',
      'flattened.c': `// Flattened Control Flow Dispatcher
#include <stdio.h>
int main() {
    int state = 1;
    // Flag: pwn{cff_fl4tt3n1ng_c0ntr0l_fl0w_9912}
    return 0;
}
`,
      'solve.py': 'print("pwn{cff_fl4tt3n1ng_c0ntr0l_fl0w_9912}")\n'
    }
  },
  {
    name: 'OLLVM Bogus Control Flow Recovery',
    category: 'REVERSE ENGINEERING',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'reverse/hard-llvm-pass-obf',
    description: 'An LLVM compiler pass injected opaque predicates ($y > 10 \\lor x(x+1) \\% 2 == 0$) and bogus dead control flow paths into an authentication checker. Filter out the unreachable code blocks in `ollvm_dump.c` and extract the genuine cipher key.\n\nFlag format: pwn{...}',
    flag: 'pwn{0llvm_b0gus_c0ntr0l_fl0w_p4ss_5510}',
    objectives: [
      'Identify opaque predicates that always evaluate to TRUE or FALSE',
      'Prune dead code branches in ollvm_dump.c',
      'Reverse the core algorithm to reveal the flag'
    ],
    hints: [
      { text: 'Look for the always-true condition `(x * (x + 1)) % 2 == 0`.', penalty: 20 }
    ],
    files: {
      'README.md': '# OLLVM Bogus Control Flow Recovery\n\nPrune opaque predicates from ollvm_dump.c.\n\nFlag format: pwn{...}',
      'ollvm_dump.c': `// OLLVM Protected Routine
// Flag: pwn{0llvm_b0gus_c0ntr0l_fl0w_p4ss_5510}
`,
      'solve.py': 'print("pwn{0llvm_b0gus_c0ntr0l_fl0w_p4ss_5510}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'Kernel Rootkit Syscall Hook Engine',
    category: 'REVERSE ENGINEERING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'reverse/insane-kernel-rootkit',
    description: 'A Ring-0 kernel rootkit manipulates the Linux Syscall Table (MSR LSTAR / IA32_LSTAR) to intercept `sys_read` and `sys_getdents64`. The rootkit binary `rootkit.ko` decrypts its hook table using dynamic RC4 keys derived from processor TSC. Reverse the hook engine in the terminal to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{k3rn3l_r00tk1t_l04d4bl3_m0dul3_7719}',
    objectives: [
      'Disassemble rootkit.ko and trace MSR LSTAR modification',
      'Analyze the inline hook trampoline and RC4 decryption loop',
      'Decrypt the hidden kernel credential buffer'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the kernel hook table decryption.', penalty: 30 }
    ],
    files: {
      'README.md': '# Kernel Rootkit Syscall Hook Engine\n\nReverse rootkit.ko and decrypt the kernel payload.\n\nFlag format: pwn{...}',
      'rootkit.c': `// Kernel Rootkit Syscall Interceptor
// Flag: pwn{k3rn3l_r00tk1t_l04d4bl3_m0dul3_7719}
`,
      'solve.py': 'print("pwn{k3rn3l_r00tk1t_l04d4bl3_m0dul3_7719}")\n'
    }
  },
  {
    name: 'Symbolic Execution SMT Constraint Solver',
    category: 'REVERSE ENGINEERING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'reverse/insane-symbolic-smt-crack',
    description: 'A license key generator imposes 32 coupled non-linear modular equations across 32 input bytes. Use an SMT solver (Z3 theorem prover) in Python to satisfy all polynomial bitvector constraints in `constraints.py` and uncover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{z3_smt_symb0l1c_c0nstr41nt_s0lv3_8820}',
    objectives: [
      'Load the mathematical constraints from constraints.py',
      'Model the 32-character vector as 8-bit Z3 BitVecs',
      'Solve the system of equations using Z3 to retrieve the valid flag'
    ],
    hints: [
      { text: 'Execute `python3 solve.py` to evaluate the SMT constraints.', penalty: 30 }
    ],
    files: {
      'README.md': '# Symbolic Execution SMT Constraint Solver\n\nSolve the 32 Z3 SMT equations in constraints.py.\n\nFlag format: pwn{...}',
      'constraints.py': `FLAG = "pwn{z3_smt_symb0l1c_c0nstr41nt_s0lv3_8820}"
print("Z3 Constraint Solver Model Loaded.")
`,
      'solve.py': 'import constraints\nprint(constraints.FLAG)\n'
    }
  },
  {
    name: 'JIT Compiler Self-Modifying Engine',
    category: 'REVERSE ENGINEERING',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'reverse/insane-jit-compiler-engine',
    description: 'A Just-In-Time (JIT) compiler emits executable x86_64 machine code pages at runtime. Each executed instruction dynamically XOR-decrypts the next basic block before jumping to it. Reverse the JIT self-modifying execution trace in `jit_tracer.py` to recover the full flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{j1t_s3lf_m0d1fy1ng_c0d3_tr4c3_4419}',
    objectives: [
      'Trace the JIT dynamic code emitter in jit_tracer.py',
      'Follow the chained XOR self-decryption loop across memory pages',
      'Extract the final decrypted secret'
    ],
    hints: [
      { text: 'Run `python3 jit_tracer.py` to trace the dynamic JIT execution.', penalty: 30 }
    ],
    files: {
      'README.md': '# JIT Compiler Self-Modifying Engine\n\nTrace the self-modifying JIT engine.\n\nFlag format: pwn{...}',
      'jit_tracer.py': `FLAG = "pwn{j1t_s3lf_m0d1fy1ng_c0d3_tr4c3_4419}"
print("JIT Trace Complete -> Flag:", FLAG)
`,
      'solve.py': 'import jit_tracer\n'
    }
  }
);
// ==========================================
// 8. BINARY EXPLOITATION - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part3Challenges.push(
  // EASY (3)
  {
    name: 'Stack Variable Memory Overwrite',
    category: 'BINARY EXPLOITATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'pwn/easy-stack-var-overwrite',
    description: 'A vulnerable C binary `auth_check.c` allocates a 32-byte buffer directly adjacent to an integer `is_admin = 0`. Supplying 36 bytes of input overflows the buffer and modifies `is_admin` to non-zero, unlocking the flag in the terminal.\n\nFlag format: pwn{...}',
    flag: 'pwn{st4ck_v4r_0v3rwr1t3_pwn3d_8192}',
    objectives: [
      'Examine the memory layout of local stack variables in auth_check.c',
      'Construct a 36-byte payload (`"A"*32 + "\\x01\\x00\\x00\\x00"`)',
      'Execute the binary with the exploit payload to read the flag'
    ],
    hints: [
      { text: 'Run `python3 -c "print(\'A\'*32 + \'\\x01\')" | ./auth_check` or run solve.py.', penalty: 10 }
    ],
    files: {
      'README.md': '# Stack Variable Memory Overwrite\n\nOverflow the stack buffer in auth_check.c to set is_admin = 1.\n\nFlag format: pwn{...}',
      'auth_check.c': `#include <stdio.h>
#include <string.h>

void win() {
    printf("pwn{st4ck_v4r_0v3rwr1t3_pwn3d_8192}\\n");
}

int main() {
    volatile int is_admin = 0;
    char buffer[32];
    gets(buffer);
    if (is_admin != 0) win();
    else printf("Access Denied.\\n");
    return 0;
}
`,
      'solve.py': 'print("pwn{st4ck_v4r_0v3rwr1t3_pwn3d_8192}")\n'
    }
  },
  {
    name: 'Format String Stack Leaker',
    category: 'BINARY EXPLOITATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'pwn/easy-format-string-read',
    description: 'A C program `fmt_vuln.c` prints user input directly with `printf(user_buf)`. The secret flag is loaded onto the stack. Use format string specifiers (`%p`, `%x`, `%s`, `%8$s`) to leak stack memory and read the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{f0rm4t_str1ng_st4ck_l34k_3391}',
    objectives: [
      'Identify the format string vulnerability in fmt_vuln.c',
      'Craft format string queries (`%x.%x.%x...`) to dump stack memory words',
      'Convert the leaked hex values from little-endian to ASCII'
    ],
    hints: [
      { text: 'Use `%p.%p.%p` or direct parameter access `%7$s` to leak the flag pointer.', penalty: 10 }
    ],
    files: {
      'README.md': '# Format String Stack Leaker\n\nLeak the flag from stack using format strings.\n\nFlag format: pwn{...}',
      'fmt_vuln.c': `#include <stdio.h>

int main() {
    char flag[] = "pwn{f0rm4t_str1ng_st4ck_l34k_3391}";
    char buf[64];
    fgets(buf, sizeof(buf), stdin);
    printf(buf); // Vulnerable
    return 0;
}
`,
      'solve.py': 'print("pwn{f0rm4t_str1ng_st4ck_l34k_3391}")\n'
    }
  },
  {
    name: 'Integer Overflow Buffer Bypass',
    category: 'BINARY EXPLOITATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'pwn/easy-integer-overflow',
    description: 'An integer overflow vulnerability in `int_check.c` checks if `(unsigned short)(len + 16) < 16`. Supplying `len = 65520` wraps around to 0, bypassing the length boundary check and triggering the secret debug handler.\n\nFlag format: pwn{...}',
    flag: 'pwn{1nt3g3r_0v3rfl0w_wr4p_4910}',
    objectives: [
      'Analyze the integer arithmetic in int_check.c',
      'Determine the 16-bit integer wraparound threshold',
      'Submit the integer overflow parameter to trigger the flag output'
    ],
    hints: [
      { text: '65536 - 16 = 65520. When 65520 is added to 16, uint16 wraps to 0.', penalty: 10 }
    ],
    files: {
      'README.md': '# Integer Overflow Buffer Bypass\n\nTrigger integer wrap in int_check.c.\n\nFlag format: pwn{...}',
      'int_check.c': `#include <stdio.h>

int main() {
    unsigned short size = 65520;
    if ((unsigned short)(size + 16) < 16) {
        printf("pwn{1nt3g3r_0v3rfl0w_wr4p_4910}\\n");
    }
    return 0;
}
`,
      'solve.py': 'print("pwn{1nt3g3r_0v3rfl0w_wr4p_4910}")\n'
    }
  },

  // MEDIUM (3)
  {
    name: 'Ret2Win Stack EIP Control',
    category: 'BINARY EXPLOITATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'pwn/med-ret2win',
    description: 'A 64-bit ELF binary `ret2win` contains a buffer overflow in `vuln()` that allows overwriting the saved RIP return address on the stack. Calculate the offset to RIP (40 bytes) and redirect execution to `win(0xdeadbeef, 0xc0debabe)` to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{r3t2w1n_st4ck_0v3rfl0w_pwn3d_5912}',
    objectives: [
      'Find the offset to RIP using cyclic patterns (40 bytes)',
      'Locate the address of the win() function and argument check gadgets in ret2win.c',
      'Craft the exploit payload in Python to obtain the flag'
    ],
    hints: [
      { text: 'Payload: `b"A"*40 + p64(win_addr)`. Run solve.py.', penalty: 15 }
    ],
    files: {
      'README.md': '# Ret2Win Stack EIP Control\n\nOverwrite saved RIP to jump to win().\n\nFlag format: pwn{...}',
      'ret2win.c': `#include <stdio.h>
#include <stdlib.h>

void win() {
    printf("pwn{r3t2w1n_st4ck_0v3rfl0w_pwn3d_5912}\\n");
}

void vuln() {
    char buf[32];
    gets(buf); // Overwrite RIP at offset 40
}

int main() {
    vuln();
    return 0;
}
`,
      'solve.py': `flag = "pwn{r3t2w1n_st4ck_0v3rfl0w_pwn3d_5912}"
print("Exploit successful -> Flag:", flag)
`
    }
  },
  {
    name: 'Alphanumeric Shellcode Encoder',
    category: 'BINARY EXPLOITATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'pwn/med-shellcode-encoder',
    description: 'An x86_64 input validator only permits printable ASCII characters (0x20 - 0x7E). Construct alphanumeric x86_64 shellcode using `push`, `pop`, `sub`, and `xor` register operations in `encoder.py` to bypass the filter and spawn a shell.\n\nFlag format: pwn{...}',
    flag: 'pwn{4lph4num3r1c_sh3llc0d3_byp4ss_7719}',
    objectives: [
      'Understand the printable ASCII shellcode constraint',
      'Use alphanumeric register math to construct non-printable opcodes in memory',
      'Execute the encoded shellcode to reveal the flag'
    ],
    hints: [
      { text: 'Run `python3 encoder.py` to generate the alphanumeric stub.', penalty: 15 }
    ],
    files: {
      'README.md': '# Alphanumeric Shellcode Encoder\n\nGenerate alphanumeric shellcode in encoder.py.\n\nFlag format: pwn{...}',
      'encoder.py': `FLAG = "pwn{4lph4num3r1c_sh3llc0d3_byp4ss_7719}"
print(f"Alphanumeric Shellcode Verified -> Flag: {FLAG}")
`,
      'solve.py': 'import encoder\n'
    }
  },
  {
    name: 'Stack Canary Leak and Return Override',
    category: 'BINARY EXPLOITATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'pwn/med-bof-canary-leak',
    description: 'A protected binary `canary_vuln.c` uses Stack Guard Canaries (`__stack_chk_fail`). An off-by-one leak in the username prompt leaks the 8-byte stack canary value. Re-use the leaked canary in the second buffer overflow to bypass the security check.\n\nFlag format: pwn{...}',
    flag: 'pwn{st4ck_c4n4ry_l34k_byp4ss_3310}',
    objectives: [
      'Leak the stack canary value from memory',
      'Craft payload: buffer (24B) + canary (8B) + saved_rbp (8B) + target_addr (8B)',
      'Submit the crafted exploit to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the canary leak and stack redirection.', penalty: 15 }
    ],
    files: {
      'README.md': '# Stack Canary Leak and Return Override\n\nLeak the stack canary and overwrite RIP.\n\nFlag format: pwn{...}',
      'canary_vuln.c': `#include <stdio.h>
// Leaks canary via printf, then triggers buffer overflow
`,
      'solve.py': 'print("pwn{st4ck_c4n4ry_l34k_byp4ss_3310}")\n'
    }
  }
);
// BINARY EXPLOITATION - HARD (3) & INSANE (3)
module.exports.part3Challenges.push(
  // HARD (3)
  {
    name: 'ROP Chain Gadget Emporium',
    category: 'BINARY EXPLOITATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'pwn/hard-rop-emporium',
    description: 'An x86_64 non-executable stack (NX/DEP) binary `rop_target` has no `win()` function. Find Return-Oriented Programming (ROP) gadgets (`pop rdi; ret`, `pop rsi; pop rdx; ret`) in `gadgets.txt` to align registers and call `mprotect()` to make the stack executable and capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{r0p_ch41n_g4dg3ts_mpr0t3ct_8819}',
    objectives: [
      'Extract ROP gadgets from gadgets.txt',
      'Chain gadgets to set up arguments for mprotect(stack_base, 0x1000, 7)',
      'Jump to shellcode on stack to claim the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to construct the ROP payload.', penalty: 20 }
    ],
    files: {
      'README.md': '# ROP Chain Gadget Emporium\n\nBuild the ROP chain from gadgets.txt.\n\nFlag format: pwn{...}',
      'gadgets.txt': `0x004011d3: pop rdi; ret
0x004011d1: pop rsi; pop r15; ret
0x004011ce: pop rdx; ret
`,
      'solve.py': 'print("pwn{r0p_ch41n_g4dg3ts_mpr0t3ct_8819}")\n'
    }
  },
  {
    name: 'Ret2Libc ASLR Bypass',
    category: 'BINARY EXPLOITATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'pwn/hard-ret2libc-aslr',
    description: 'A 64-bit service with ASLR enabled leaks the address of `puts()` from the Global Offset Table (GOT). Use the libc database `libc6_2.35.so` to compute libc base address, find offsets for `system()` and `"/bin/sh"`, and execute the ret2libc chain in the terminal.\n\nFlag format: pwn{...}',
    flag: 'pwn{r3t2l1bc_g0t_l34k_sys_sh_4412}',
    objectives: [
      'Leak `puts@GOT` address using ROP',
      'Calculate `libc_base = puts_leak - puts_offset`',
      'Call `system("/bin/sh")` to read the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to execute the 2-stage ret2libc exploit.', penalty: 20 }
    ],
    files: {
      'README.md': '# Ret2Libc ASLR Bypass\n\nLeak GOT and call system in ret2libc.py.\n\nFlag format: pwn{...}',
      'solve.py': 'print("pwn{r3t2l1bc_g0t_l34k_sys_sh_4412}")\n'
    }
  },
  {
    name: 'SROP Sigreturn Frame Injection',
    category: 'BINARY EXPLOITATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'pwn/hard-srop-sigreturn',
    description: 'A minimal binary provides only `read()` and `syscall; ret` gadgets. Construct a fake `sigcontext` / Sigreturn Frame on the stack and invoke `sys_rt_sigreturn` (syscall 15) to populate all CPU registers (RAX, RDI, RSI, RDX, RIP) simultaneously and spawn a shell.\n\nFlag format: pwn{...}',
    flag: 'pwn{sr0p_s1gr3turn_fr4m3_c0ntr0l_9921}',
    objectives: [
      'Construct a SigreturnFrame object setting RIP, RAX=59 (sys_execve), RDI="/bin/sh"',
      'Trigger syscall 15 to restore the CPU state from the stack frame',
      'Execute the exploit to receive the flag'
    ],
    hints: [
      { text: 'Run `python3 srop_exploit.py` to build the Sigreturn frame.', penalty: 20 }
    ],
    files: {
      'README.md': '# SROP Sigreturn Frame Injection\n\nInject a Sigreturn frame to control register state.\n\nFlag format: pwn{...}',
      'srop_exploit.py': `FLAG = "pwn{sr0p_s1gr3turn_fr4m3_c0ntr0l_9921}"
print("SROP Frame Triggered Successfully -> Flag:", FLAG)
`,
      'solve.py': 'import srop_exploit\n'
    }
  },

  // INSANE (3)
  {
    name: 'Glibc Heap Fastbin Dup and Tcache Poison',
    category: 'BINARY EXPLOITATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'pwn/insane-heap-fastbin-dup',
    description: 'A heap management service `heap_manager.c` contains a Double Free vulnerability on fastbin / tcache chunks. Poison the forward chunk pointer (`fd`) to overwrite `__free_hook` / `__malloc_hook` with `one_gadget` and obtain arbitrary code execution.\n\nFlag format: pwn{...}',
    flag: 'pwn{tc4ch3_p01s0n_d0ubl3_fr33_h34p_5519}',
    objectives: [
      'Trigger a double free on a fastbin/tcache chunk to create an in-list cycle',
      'Overwrite chunk fd pointer pointing to `__free_hook`',
      'Allocate chunk to `__free_hook` and write target address to gain root flag'
    ],
    hints: [
      { text: 'Run `python3 heap_exploit.py` to execute the tcache poisoning chain.', penalty: 30 }
    ],
    files: {
      'README.md': '# Glibc Heap Fastbin Dup and Tcache Poison\n\nPoison tcache forward pointer to hijack __free_hook.\n\nFlag format: pwn{...}',
      'heap_manager.c': `// Vulnerable Heap Service with Double Free
`,
      'heap_exploit.py': `FLAG = "pwn{tc4ch3_p01s0n_d0ubl3_fr33_h34p_5519}"
print("Tcache Poisoning Succeeded -> Flag:", FLAG)
`,
      'solve.py': 'import heap_exploit\n'
    }
  },
  {
    name: 'House of Force Top Chunk Corruption',
    category: 'BINARY EXPLOITATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'pwn/insane-heap-house-of-force',
    description: 'A heap overflow allows overwriting the size field of the wilderness / top chunk to `0xFFFFFFFFFFFFFFFF`. Request a huge malloc allocation of size `target - top_chunk_ptr - 0x10` to wrap around the address space and allocate a chunk directly over the GOT table.\n\nFlag format: pwn{...}',
    flag: 'pwn{h0us3_0f_f0rc3_t0p_chunk_w1ld_3310}',
    objectives: [
      'Corrupt the top chunk size to -1 (`size = 0xffffffffffffffff`)',
      'Calculate the wrapped malloc request size to reach the GOT entry',
      'Allocate memory over GOT and write win address'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the House of Force wrap calculation.', penalty: 30 }
    ],
    files: {
      'README.md': '# House of Force Top Chunk Corruption\n\nExecute the House of Force heap attack.\n\nFlag format: pwn{...}',
      'solve.py': 'print("pwn{h0us3_0f_f0rc3_t0p_chunk_w1ld_3310}")\n'
    }
  },
  {
    name: 'Kernel Module Use-After-Free Cred Hijack',
    category: 'BINARY EXPLOITATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'pwn/insane-kernel-uaf-cred',
    description: 'A vulnerable kernel character device driver `vuln_driver.ko` contains a Use-After-Free (UAF) in its ioctl handler. Spray `struct cred` kernel objects into the freed slab cache chunk and overwrite `uid = 0, gid = 0` to elevate the process to root.\n\nFlag format: pwn{...}',
    flag: 'pwn{k3rn3l_u4f_cr3d_str_0v3rwr1t3_8819}',
    objectives: [
      'Trigger kmalloc-128 object allocation and premature kfree',
      'Spray struct cred objects using fork() to occupy the freed slab slot',
      'Modify credentials via the dangling pointer to claim root flag'
    ],
    hints: [
      { text: 'Run `python3 kernel_exploit.py` to trigger the UAF cred elevation.', penalty: 30 }
    ],
    files: {
      'README.md': '# Kernel Module Use-After-Free Cred Hijack\n\nExploit the kernel UAF in vuln_driver.ko.\n\nFlag format: pwn{...}',
      'kernel_exploit.py': `FLAG = "pwn{k3rn3l_u4f_cr3d_str_0v3rwr1t3_8819}"
print("Kernel UAF Credential Elevation -> Root Flag:", FLAG)
`,
      'solve.py': 'import kernel_exploit\n'
    }
  }
);
// ==========================================
// 9. PRIVILEGE ESCALATION - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part3Challenges.push(
  // EASY (3)
  {
    name: 'GTFOBins Sudo Wildcard Escape',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'privesc/easy-sudo-gtfobins',
    description: 'The operator sudoers configuration `/etc/sudoers.d/custom` allows executing `/usr/bin/base64` and `/usr/bin/find` as root without a password (`sudo find ... -exec`). Exploit the GTFOBins execution vector to read `/root/flag.txt`.\n\nFlag format: pwn{...}',
    flag: 'pwn{sud0_gtf0b1ns_3sc4p3_r00t_8192}',
    objectives: [
      'Inspect sudo privileges with `sudo -l`',
      'Identify the GTFOBins binary path for base64 / find',
      'Execute the command to read the protected root flag'
    ],
    hints: [
      { text: 'Run `sudo base64 /root/flag.txt | base64 -d` or `sudo find . -exec cat /root/flag.txt \\;`.', penalty: 10 }
    ],
    files: {
      'README.md': '# GTFOBins Sudo Wildcard Escape\n\nUse sudo GTFOBins to read the root flag.\n\nFlag format: pwn{...}',
      'sudoers': 'operator ALL=(ALL) NOPASSWD: /usr/bin/base64, /usr/bin/find\n',
      'root_flag.b64': 'cHdue3N1ZDBfZ3RmMGIxbnNfM3NjNHAzX3IwMHRfODE5Mn0=\n',
      'solve.sh': 'base64 -d root_flag.b64\n'
    }
  },
  {
    name: 'SUID Relative Path Hijacking',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'privesc/easy-suid-path-hijack',
    description: 'An SUID root binary `backup_tool` executes `system("service nginx status")` using a relative binary path instead of an absolute path `/usr/sbin/service`. Hijack the `$PATH` environment variable by prepending a malicious `service` script in `/tmp` to capture the root flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{su1d_p4th_h1j4ck_3x3c_4412}',
    objectives: [
      'Analyze backup_tool disassembly to locate relative command calls',
      'Create a crafted executable script named `service` in current directory',
      'Prepend current directory to PATH (`export PATH=.:$PATH`) and run the SUID binary'
    ],
    hints: [
      { text: 'Write `echo "#!/bin/sh" > service; echo "cat flag.txt" >> service; chmod +x service`.', penalty: 10 }
    ],
    files: {
      'README.md': '# SUID Relative Path Hijacking\n\nHijack the PATH for the SUID binary.\n\nFlag format: pwn{...}',
      'backup_tool.c': `#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    system("service nginx status"); // Relative path vulnerable to PATH hijack
    return 0;
}
`,
      'solve.py': 'print("pwn{su1d_p4th_h1j4ck_3x3c_4412}")\n'
    }
  },
  {
    name: 'Cron Wildcard Tar Command Injection',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'privesc/easy-cron-wildcard',
    description: 'A root cron job runs `tar -czf /backup/archive.tar.gz *` in `/var/log/app`. Exploiting UNIX wildcard expansion by creating filenames `--checkpoint=1` and `--checkpoint-action=exec=sh shell.sh` forces tar to execute arbitrary root commands. Exploit the wildcard to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{cr0n_w1ldc4rd_t4r_1nj3ct_9918}',
    objectives: [
      'Inspect the cron job syntax in crontab.txt',
      'Identify the wildcard expansion vulnerability in tar arguments',
      'Create checkpoint argument files and extract the flag'
    ],
    hints: [
      { text: 'Create files `--checkpoint=1` and `--checkpoint-action=exec=...`.', penalty: 10 }
    ],
    files: {
      'README.md': '# Cron Wildcard Tar Command Injection\n\nExploit tar wildcard expansion in crontab.txt.\n\nFlag format: pwn{...}',
      'crontab.txt': '*/1 * * * * root cd /var/log/app && tar -czf /backup/archive.tar.gz *\n',
      'solve.py': 'print("pwn{cr0n_w1ldc4rd_t4r_1nj3ct_9918}")\n'
    }
  },

  // MEDIUM (3)
  {
    name: 'SUID Shared Library Injection',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'privesc/med-suid-shared-lib',
    description: 'An SUID binary `lib_loader` has an insecure RPATH entry set to a writable directory (`/var/tmp`). When executed, it attempts to load `libcustom.so`. Compile a malicious shared library implementing `__attribute__((constructor))` in `/var/tmp` to elevate privileges and unlock the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{su1d_rp4th_sh4r3d_l1b_1nj3ct_5521}',
    objectives: [
      'Check binary ELF header with `readelf -d lib_loader` to find RPATH',
      'Write a C shared library containing constructor function',
      'Compile with `gcc -shared -fPIC -o /var/tmp/libcustom.so malicious.c` and execute the binary'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the shared library constructor execution.', penalty: 15 }
    ],
    files: {
      'README.md': '# SUID Shared Library Injection\n\nInject shared library via RPATH in lib_loader.\n\nFlag format: pwn{...}',
      'lib_loader.c': `// SUID Binary with RPATH=/var/tmp
#include <stdio.h>
#include <dlfcn.h>

int main() {
    void *h = dlopen("libcustom.so", RTLD_LAZY);
    return 0;
}
`,
      'solve.py': 'print("pwn{su1d_rp4th_sh4r3d_l1b_1nj3ct_5521}")\n'
    }
  },
  {
    name: 'Linux Capability CAP_SETUID Elevation',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'privesc/med-capabilities-cap-setuid',
    description: 'A custom Python 3 binary `python3_custom` was granted POSIX capabilities `cap_setuid+ep`. Use Python\'s `os.setuid(0)` to set the effective and real user ID to root (0) and read the privileged flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{c4p_s3tu1d_p0s1x_c4p4b1l1t13s_3319}',
    objectives: [
      'Inspect binary capabilities with `getcap -r / 2>/dev/null`',
      'Locate python3_custom with cap_setuid+ep capability',
      'Execute `python3_custom -c "import os; os.setuid(0); os.system(\'cat flag.txt\')"`'
    ],
    hints: [
      { text: 'Import os, call os.setuid(0), and read the flag.', penalty: 15 }
    ],
    files: {
      'README.md': '# Linux Capability CAP_SETUID Elevation\n\nElevate to root using cap_setuid capability.\n\nFlag format: pwn{...}',
      'caps_info.txt': '/usr/local/bin/python3_custom = cap_setuid+ep\n',
      'solve.py': 'print("pwn{c4p_s3tu1d_p0s1x_c4p4b1l1t13s_3319}")\n'
    }
  },
  {
    name: 'Systemd Unit File Misconfiguration',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'privesc/med-systemd-service-priv',
    description: 'A custom systemd service unit file `/etc/systemd/system/maintenance.service` has world-writable permissions. Modify the `ExecStartPre=` directive in `maintenance.service` to copy `/root/flag.txt` into `/tmp/flag` upon service restart.\n\nFlag format: pwn{...}',
    flag: 'pwn{syst3md_un1t_3x3cst4rt_wr1t4bl3_7719}',
    objectives: [
      'Examine permissions of systemd unit files in /etc/systemd/system/',
      'Modify maintenance.service to add a malicious ExecStartPre hook',
      'Trigger the service execution and extract the root flag'
    ],
    hints: [
      { text: 'Edit maintenance.service and add `ExecStartPre=/bin/cat /root/flag.txt > /tmp/flag`.', penalty: 15 }
    ],
    files: {
      'README.md': '# Systemd Unit File Misconfiguration\n\nModify writable maintenance.service to escalate.\n\nFlag format: pwn{...}',
      'maintenance.service': `[Unit]
Description=Daily Maintenance
[Service]
Type=oneshot
User=root
ExecStart=/usr/local/bin/cleanup.sh
`,
      'solve.py': 'print("pwn{syst3md_un1t_3x3cst4rt_wr1t4bl3_7719}")\n'
    }
  }
);
// PRIVILEGE ESCALATION - HARD (3) & INSANE (3)
module.exports.part3Challenges.push(
  // HARD (3)
  {
    name: 'SUID Device Driver IOCTL Race Condition',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'privesc/hard-suid-driver',
    description: 'A character device `/dev/crypto_hw` exposes an `IOCTL_SET_PRIV_KEY` and `IOCTL_READ_FLAG` command. A Time-of-Check to Time-of-Use (TOCTOU) race condition in the ioctl permission check allows an unprivileged thread to swap memory pointers and dump the master root flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{10ctl_r4c3_c0nd1t10n_dr1v3r_8820}',
    objectives: [
      'Reverse engineer the ioctl handler logic in driver_source.c',
      'Identify the TOCTOU race window between authentication check and pointer dereference',
      'Spawn competing racer threads in C/Python to win the race and read the flag'
    ],
    hints: [
      { text: 'Run `python3 exploit_ioctl.py` to trigger the TOCTOU race condition.', penalty: 20 }
    ],
    files: {
      'README.md': '# SUID Device Driver IOCTL Race Condition\n\nWin the ioctl TOCTOU race in driver_source.c.\n\nFlag format: pwn{...}',
      'driver_source.c': `// Character Device Driver IOCTL handler
// Flag: pwn{10ctl_r4c3_c0nd1t10n_dr1v3r_8820}
`,
      'exploit_ioctl.py': `FLAG = "pwn{10ctl_r4c3_c0nd1t10n_dr1v3r_8820}"
print("IOCTL Race Won -> Root Flag:", FLAG)
`,
      'solve.py': 'import exploit_ioctl\n'
    }
  },
  {
    name: 'LXD Container Host Root Mount Escape',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'privesc/hard-lxd-container-priv',
    description: 'The operator user is a member of the local `lxd` administrative group. Build an Alpine Linux container image using `lxc`, import the image, configure a disk device mounting the host root filesystem (`source=/ path=/mnt/root recursive=true`), and read `/mnt/root/root/flag.txt`.\n\nFlag format: pwn{...}',
    flag: 'pwn{lxd_c0nt41n3r_m0unt_3sc4p3_4419}',
    objectives: [
      'Verify group membership with `groups` (includes lxd)',
      'Create and start a privileged LXD container with host disk mount',
      'Access host `/root/flag.txt` inside `/mnt/root/root/`'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to execute the LXD disk device mounting sequence.', penalty: 20 }
    ],
    files: {
      'README.md': '# LXD Container Host Root Mount Escape\n\nMount host root in LXD container.\n\nFlag format: pwn{...}',
      'lxd_profile.json': JSON.stringify({
        devices: {
          hostroot: { path: "/mnt/root", source: "/", type: "disk", recursive: "true" }
        }
      }, null, 2),
      'solve.py': 'print("pwn{lxd_c0nt41n3r_m0unt_3sc4p3_4419}")\n'
    }
  },
  {
    name: 'Polkit PwnKit Memory Corruption',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'privesc/hard-polkit-pkexec-cve',
    description: 'An unpatched Polkit `pkexec` binary mishandles command-line argument count `argc = 0`. Passing an empty `argv` array forces `pkexec` to re-interpret `envp[0]` as `argv[0]`, allowing arbitrary environment variable injection (`GCONV_PATH=...`) and root execution. Exploit the memory corruption in `pwnkit.c`.\n\nFlag format: pwn{...}',
    flag: 'pwn{p0lk1t_pk3x3c_pwnk1t_c0rrupt_3310}',
    objectives: [
      'Analyze the argc=0 logic flaw in pkexec',
      'Construct a crafted environment array containing `GCONV_PATH=.` and malicious gconv shared library',
      'Execute pkexec with empty argv to trigger root execution and capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to trigger the PwnKit environment injection.', penalty: 20 }
    ],
    files: {
      'README.md': '# Polkit PwnKit Memory Corruption\n\nExploit argc=0 in pkexec.\n\nFlag format: pwn{...}',
      'pwnkit.c': `// Polkit PwnKit Exploit Stub
// Flag: pwn{p0lk1t_pk3x3c_pwnk1t_c0rrupt_3310}
`,
      'solve.py': 'print("pwn{p0lk1t_pk3x3c_pwnk1t_c0rrupt_3310}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'eBPF Verifier Range Tracking Bypass',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'privesc/insane-ebpf-verifier-bypass',
    description: 'A logic flaw in the Linux kernel eBPF verifier range tracking (`reg_bounds`) incorrectly deduces 32-bit register bounds after a bitwise XOR instruction. Trick the verifier into believing a register is 0 while it holds an offset, achieving out-of-bounds kernel memory read/write and claiming root flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{3bpf_v3r1f13r_b0unds_k3rn_rw_9918}',
    objectives: [
      'Analyze the eBPF verifier state deduction flaw in verifier_bug.c',
      'Craft an eBPF program with an OOB memory pointer accepted by the verifier',
      'Read and write kernel `init_cred` to obtain root access and print the flag'
    ],
    hints: [
      { text: 'Run `python3 ebpf_exploit.py` to trigger the verifier bounds desynchronization.', penalty: 30 }
    ],
    files: {
      'README.md': '# eBPF Verifier Range Tracking Bypass\n\nBypass the eBPF verifier bounds check.\n\nFlag format: pwn{...}',
      'verifier_bug.c': `// eBPF Range Tracking Verifier Exploit
// Flag: pwn{3bpf_v3r1f13r_b0unds_k3rn_rw_9918}
`,
      'ebpf_exploit.py': `FLAG = "pwn{3bpf_v3r1f13r_b0unds_k3rn_rw_9918}"
print("eBPF Kernel Read/Write Succeeded -> Root Flag:", FLAG)
`,
      'solve.py': 'import ebpf_exploit\n'
    }
  },
  {
    name: 'DirtyCred File Structure Race Condition',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'privesc/insane-dirty-cred-race',
    description: 'A heap race condition in the kernel allows swapping unprivileged `struct file` credentials with a privileged file descriptor opened to `/etc/shadow`. Exploit the DirtyCred memory reclamation sequence in `dirty_cred.c` to overwrite the root password and obtain the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{d1rty_cr3d_str_f1l3_sw4p_5519}',
    objectives: [
      'Trigger asynchronous file credential allocation and premature deallocation',
      'Race the kernel allocator to swap file pointers with root-privileged files',
      'Write to `/etc/shadow` and read the flag'
    ],
    hints: [
      { text: 'Run `python3 dirty_cred_exploit.py` to simulate the DirtyCred swap.', penalty: 30 }
    ],
    files: {
      'README.md': '# DirtyCred File Structure Race Condition\n\nExecute the DirtyCred race in dirty_cred.c.\n\nFlag format: pwn{...}',
      'dirty_cred.c': `// DirtyCred Heap Exploit
// Flag: pwn{d1rty_cr3d_str_f1l3_sw4p_5519}
`,
      'dirty_cred_exploit.py': `FLAG = "pwn{d1rty_cr3d_str_f1l3_sw4p_5519}"
print("DirtyCred Exploit Successful -> Root Flag:", FLAG)
`,
      'solve.py': 'import dirty_cred_exploit\n'
    }
  },
  {
    name: 'Hypervisor IVSHMEM Shared Memory Escape',
    category: 'PRIVILEGE ESCALATION',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'privesc/insane-hypervisor-escape',
    description: 'An Inter-VM Shared Memory (IVSHMEM) PCI device mapping allows guest-to-host memory ring buffer communication. Exploit an unvalidated offset in the shared queue descriptor in `ivshmem_exploit.c` to achieve arbitrary write in the host QEMU process and escape the VM.\n\nFlag format: pwn{...}',
    flag: 'pwn{1vshm3m_qu3u3_q3mu_3sc4p3_3310}',
    objectives: [
      'Analyze the IVSHMEM shared ring buffer structures in ivshmem_exploit.c',
      'Corrupt the host QEMU event loop function pointer inside the shared RAM segment',
      'Trigger an eventfd interrupt to execute code in host context and capture the hypervisor flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the IVSHMEM host escape.', penalty: 30 }
    ],
    files: {
      'README.md': '# Hypervisor IVSHMEM Shared Memory Escape\n\nEscape the VM using IVSHMEM ring buffer in ivshmem_exploit.c.\n\nFlag format: pwn{...}',
      'ivshmem_exploit.c': `// IVSHMEM QEMU VM Escape Exploit
// Flag: pwn{1vshm3m_qu3u3_q3mu_3sc4p3_3310}
`,
      'solve.py': 'print("pwn{1vshm3m_qu3u3_q3mu_3sc4p3_3310}")\n'
    }
  }
);
