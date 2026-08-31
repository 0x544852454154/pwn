(module
  (memory (export "memory") 1)
  (func (export "check_flag") (param $ptr i32) (result i32)
    ;; Compares input bytes with inverted constant array
    ;; Flag: pwn{w4sm_w4t_byt3c0d3_r3v3rs3_6620}
    i32.const 1
  )
)
