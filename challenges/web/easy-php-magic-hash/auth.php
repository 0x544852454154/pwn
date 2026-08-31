<?php
$admin_hash = "0e215962017382049182390182348102";
$input = $_GET['passcode'];
if (md5($input) == $admin_hash) {
    echo "pwn{php_m4g1c_h4sh_l00s3_c0mp4r3_4190}";
}
?>