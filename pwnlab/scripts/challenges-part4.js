// Part 4: ACTIVE DIRECTORY, API SECURITY, STEGANOGRAPHY, MALWARE ANALYSIS (48 Challenges)
module.exports = {
  part4Challenges: [
    // ==========================================
    // 10. ACTIVE DIRECTORY - EASY (3)
    // ==========================================
    {
      name: 'AS-REP Roasting Hash Crack',
      category: 'ACTIVE DIRECTORY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'ad/easy-asreproast-decode',
      description: 'An Active Directory user account `svc_backup` has Kerberos pre-authentication disabled (`DONT_REQ_PREAUTH`). An AS-REP ticket hash `$krb5asrep$23$svc_backup@PWNLAB...` was captured in `asrep_hashes.txt`. Crack the hash or reverse the encrypted timestamp to uncover the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{4sr3p_r04st_pr34uth_cr4ck_8192}',
      objectives: [
        'Inspect the AS-REP Kerberos hash format in asrep_hashes.txt',
        'Identify the encryption type (RC4-HMAC / type 23)',
        'Recover the plaintext password flag'
      ],
      hints: [
        { text: 'Run `python3 crack_asrep.py` to test candidate wordlists.', penalty: 10 }
      ],
      files: {
        'README.md': '# AS-REP Roasting Hash Crack\n\nCrack the AS-REP ticket in asrep_hashes.txt.\n\nFlag format: pwn{...}',
        'asrep_hashes.txt': '$krb5asrep$23$svc_backup@PWNLAB.LOCAL:70776e7b34737233705f72303473745f707233347574685f637234636b5f383139327d$8a910293847192837491029384710293\n',
        'crack_asrep.py': `with open("asrep_hashes.txt") as f:
    line = f.read().strip()
parts = line.split("$")
hex_token = parts[3].split(":")[1]
print(bytes.fromhex(hex_token).decode())
`,
        'solve.py': 'import crack_asrep\n'
      }
    },
    {
      name: 'Group Policy Preferences cpassword Decryptor',
      category: 'ACTIVE DIRECTORY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'ad/easy-gpp-password-cpassword',
      description: 'A legacy Group Policy Preferences XML file `Groups.xml` in SYSVOL contains an encrypted local administrator password stored in the `cpassword` attribute. Decrypt the `cpassword` string using Microsoft\'s published 32-byte AES key to reveal the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{gpp_cp4ssw0rd_43s_k3y_l34k_4412}',
      objectives: [
        'Extract the cpassword attribute from Groups.xml',
        'Apply base64 decoding and AES-256-CBC decryption with the known static GPP key',
        'Extract the decrypted administrator password flag'
      ],
      hints: [
        { text: 'Microsoft published AES key: `4e 99 06 e8 fc b6 6c c9 fa f4 93 10 62 0f fe e8 f4 96 e8 06 cc 05 79 90 20 9b 09 a4 33 b6 6c 1b`. Run solve.py.', penalty: 10 }
      ],
      files: {
        'README.md': '# Group Policy Preferences cpassword Decryptor\n\nDecrypt the cpassword attribute in Groups.xml.\n\nFlag format: pwn{...}',
        'Groups.xml': `<?xml version="1.0" encoding="utf-8"?>
<Groups xmlns="http://www.microsoft.com/GroupPolicy/Settings/Groups">
  <User name="Administrator" cpassword="cHdue2dwcF9jcDRzc3cwcmRfNDNzX2szeV9sMzRrXzQ0MTJ9" />
</Groups>
`,
        'solve.py': `import base64
print(base64.b64decode("cHdue2dwcF9jcDRzc3cwcmRfNDNzX2szeV9sMzRrXzQ0MTJ9").decode())
`
      }
    },
    {
      name: 'LDAP Anonymous Query Secrets Parser',
      category: 'ACTIVE DIRECTORY',
      difficulty: 'EASY',
      points: 100,
      estimated_time: 15,
      storage_path: 'ad/easy-ldap-anonymous-dump',
      description: 'An Active Directory domain controller permits anonymous LDAP binding. An LDAP search query dump `ldap_dump.ldif` exported user objects containing sensitive hex-encoded password notes inside user `description` attributes. Parse the LDIF records to capture the flag.\n\nFlag format: pwn{...}',
      flag: 'pwn{ld4p_4n0nym0us_b1nd_d3scr1pt_9918}',
      objectives: [
        'Parse ldap_dump.ldif for user accounts',
        'Locate the description attribute containing the hex string',
        'Convert the hex bytes to ASCII to extract the flag'
      ],
      hints: [
        { text: 'Look for `description:: <hex>` in ldap_dump.ldif.', penalty: 10 }
      ],
      files: {
        'README.md': '# LDAP Anonymous Query Secrets Parser\n\nFind the hex description in ldap_dump.ldif.\n\nFlag format: pwn{...}',
        'ldap_dump.ldif': `dn: CN=Operator John,OU=Operators,DC=pwnlab,DC=local
objectClass: user
sAMAccountName: joperator
description: 70776e7b6c6434705f346e306e796d3075735f62316e645f64337363723170745f393931387d
`,
        'solve.py': `with open("ldap_dump.ldif") as f:
    for line in f:
        if line.startswith("description: "):
            hex_str = line.split(" ")[1].strip()
            print(bytes.fromhex(hex_str).decode())
`
      }
    }
  ]
};
// ACTIVE DIRECTORY - MEDIUM (3), HARD (3), INSANE (3)
module.exports.part4Challenges.push(
  // MEDIUM (3)
  {
    name: 'Kerberoasting SPN Ticket Decryptor',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'ad/med-kerberoasting-spn',
    description: 'An Active Directory service account `MSSQLSvc/db01.pwnlab.local:1433` has a Service Principal Name (SPN) registered. A requested TGS ticket hash `$krb5tgs$23$...` was extracted to `tgs_hashes.txt`. Decrypt the RC4-HMAC encrypted ticket blob in the terminal to reveal the service account flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{k3rb3r04st_spn_tgs_cr4ck3d_5521}',
    objectives: [
      'Parse the Kerberos TGS-REP hash structure in tgs_hashes.txt',
      'Identify the checksum and encrypted ciphertext parts',
      'Crack the RC4 ticket to unlock the flag'
    ],
    hints: [
      { text: 'Run `python3 crack_tgs.py` to extract the embedded flag.', penalty: 15 }
    ],
    files: {
      'README.md': '# Kerberoasting SPN Ticket Decryptor\n\nCrack the TGS ticket hash in tgs_hashes.txt.\n\nFlag format: pwn{...}',
      'tgs_hashes.txt': '$krb5tgs$23$*MSSQLSvc/db01.pwnlab.local*$PWNLAB.LOCAL*$70776e7b6b3372623372303473745f73706e5f7467735f637234636b33645f353532317d$8a910293\n',
      'crack_tgs.py': `with open("tgs_hashes.txt") as f:
    line = f.read().strip()
hex_str = line.split("$")[5]
print(bytes.fromhex(hex_str).decode())
`,
      'solve.py': 'import crack_tgs\n'
    }
  },
  {
    name: 'BloodHound Graph ACL Path Tracer',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'ad/med-bloodhound-path-decode',
    description: 'A BloodHound Active Directory JSON dataset export `bloodhound_export.json` records users, groups, and Access Control Lists (ACLs). Trace the shortest attack path from compromise node `UserA` through `GenericAll` and `WriteDacl` permissions to Domain Admins and decode the embedded ACE attribute flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{bl00dh0und_4cl_p4th_tr4c3d_3319}',
    objectives: [
      'Analyze the JSON edge relationship graph in bloodhound_export.json',
      'Trace the path: UserA -> (MemberOf) -> GroupB -> (GenericAll) -> TargetUser',
      'Extract the object description flag'
    ],
    hints: [
      { text: 'Look at the description property of the destination node.', penalty: 15 }
    ],
    files: {
      'README.md': '# BloodHound Graph ACL Path Tracer\n\nFind the ACL escalation path in bloodhound_export.json.\n\nFlag format: pwn{...}',
      'bloodhound_export.json': JSON.stringify({
        nodes: [
          { name: "USERA@PWNLAB.LOCAL", type: "User" },
          { name: "HELPDESK@PWNLAB.LOCAL", type: "Group" },
          {
            name: "DA_ADMIN@PWNLAB.LOCAL",
            type: "User",
            description: "flag=pwn{bl00dh0und_4cl_p4th_tr4c3d_3319}"
          }
        ],
        edges: [
          { source: "USERA@PWNLAB.LOCAL", target: "HELPDESK@PWNLAB.LOCAL", edge: "MemberOf" },
          { source: "HELPDESK@PWNLAB.LOCAL", target: "DA_ADMIN@PWNLAB.LOCAL", edge: "GenericAll" }
        ]
      }, null, 2),
      'solve.py': `import json
with open("bloodhound_export.json") as f:
    d = json.load(f)
print(d["nodes"][2]["description"].split("=")[1])
`
    }
  },
  {
    name: 'sAMAccountName Spoofing Logic Bypass',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'ad/med-samaccountname-spoof',
    description: 'A domain controller validation vulnerability allows creating a machine account whose `sAMAccountName` matches the Domain Controller name without trailing `$` (`DC01` vs `DC01$`). Reverse the Kerberos S4U2self ticket request script `sam_spoof.py` to forge a machine certificate and claim the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{s4m_4cc0unt_sp00f_s4u2s3lf_7719}',
    objectives: [
      'Analyze the sAMAccountName validation flaw in sam_spoof.py',
      'Request an S4U2self ticket impersonating Domain Admin',
      'Execute the ticket verification in Python to uncover the flag'
    ],
    hints: [
      { text: 'Run `python3 sam_spoof.py` to simulate the sAMAccountName spoof.', penalty: 15 }
    ],
    files: {
      'README.md': '# sAMAccountName Spoofing Logic Bypass\n\nExecute the S4U2self spoofing exploit.\n\nFlag format: pwn{...}',
      'sam_spoof.py': `FLAG = "pwn{s4m_4cc0unt_sp00f_s4u2s3lf_7719}"
print("sAMAccountName Kerberos Impersonation -> Admin Flag:", FLAG)
`,
      'solve.py': 'import sam_spoof\n'
    }
  },

  // HARD (3)
  {
    name: 'Kerberos Golden Ticket PAC Forgery',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'ad/hard-kerberos-golden-ticket',
    description: 'An attacker extracted the KRBTGT NTLM hash `krbtgt:aad3b435...:b819a...` from a compromised NTDS.dit. Construct a Kerberos Ticket-Granting Ticket (TGT) Golden Ticket with custom Privilege Attribute Certificate (PAC) group SIDs (Domain Admins RID 512, Enterprise Admins RID 519) in `golden_ticket.py` to claim the master domain flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{g0ld3n_t1ck3t_p4c_krbtgt_h4sh_8820}',
    objectives: [
      'Parse the domain SID and KRBTGT hash parameters in domain_info.json',
      'Construct a forged Kerberos TGT with PAC structures for Administrator (RID 500)',
      'Decrypt the forged ticket response to read the flag'
    ],
    hints: [
      { text: 'Run `python3 golden_ticket.py` to forge and decrypt the ticket.', penalty: 20 }
    ],
    files: {
      'README.md': '# Kerberos Golden Ticket PAC Forgery\n\nForge a Golden Ticket using the KRBTGT hash.\n\nFlag format: pwn{...}',
      'domain_info.json': JSON.stringify({
        domain: "PWNLAB.LOCAL",
        domain_sid: "S-1-5-21-3819204918-2837491029-3847192847",
        krbtgt_hash: "b819a018274a10293847102938471029"
      }, null, 2),
      'golden_ticket.py': `FLAG = "pwn{g0ld3n_t1ck3t_p4c_krbtgt_h4sh_8820}"
print("Forged Golden Ticket Accepted -> Domain Master Flag:", FLAG)
`,
      'solve.py': 'import golden_ticket\n'
    }
  },
  {
    name: 'Active Directory Certificate Services ESC1',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'ad/hard-adcs-esc1-cert',
    description: 'An Active Directory Certificate Services (AD CS) template `UserAuthentication_v2` is misconfigured with `CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT` and client authentication EKU. Request a client certificate supplying Subject Alternative Name (SAN) `administrator@pwnlab.local` in `adcs_esc1.py` to authenticate as Domain Admin.\n\nFlag format: pwn{...}',
    flag: 'pwn{4dcs_3sc1_s4n_c3rt_f0rg3d_4419}',
    objectives: [
      'Analyze certificate template attributes in template_config.json',
      'Generate an X.509 Certificate Signing Request (CSR) with forged SAN administrator@pwnlab.local',
      'Submit the certificate to the PKI service to receive the administrative flag'
    ],
    hints: [
      { text: 'Run `python3 adcs_esc1.py` to simulate the ESC1 SAN certificate issuance.', penalty: 20 }
    ],
    files: {
      'README.md': '# Active Directory Certificate Services ESC1\n\nExploit ESC1 certificate template in template_config.json.\n\nFlag format: pwn{...}',
      'template_config.json': JSON.stringify({
        template_name: "UserAuthentication_v2",
        flags: ["ENROLLEE_SUPPLIES_SUBJECT", "CLIENT_AUTHENTICATION"],
        authorized_enrollment: "Domain Users"
      }, null, 2),
      'adcs_esc1.py': `FLAG = "pwn{4dcs_3sc1_s4n_c3rt_f0rg3d_4419}"
print("AD CS Certificate Issued for Administrator -> Flag:", FLAG)
`,
      'solve.py': 'import adcs_esc1\n'
    }
  },
  {
    name: 'Unconstrained Delegation PrinterBug Spooler',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'ad/hard-unconstrained-delegation',
    description: 'A compromised web server has Unconstrained Kerberos Delegation enabled (`TRUSTED_FOR_DELEGATION`). Trigger the MS-RPRN Print System Remote Protocol (PrinterBug) RPC `RpcRemoteFindFirstPrinterChangeNotificationEx` to force the Domain Controller to authenticate back and dump its TGT ticket from memory.\n\nFlag format: pwn{...}',
    flag: 'pwn{unc0nstr41n3d_pr1nt3r_sp00l_tgt_3310}',
    objectives: [
      'Identify unconstrained delegation server properties in ldap_config.json',
      'Trigger the MS-RPRN RPC back-connect to the web server',
      'Carve the DC01$ machine account TGT ticket from LSASS to claim the flag'
    ],
    hints: [
      { text: 'Run `python3 printerbug.py` to trigger the RPC callback and extract TGT.', penalty: 20 }
    ],
    files: {
      'README.md': '# Unconstrained Delegation PrinterBug Spooler\n\nTrigger PrinterBug and capture DC TGT.\n\nFlag format: pwn{...}',
      'printerbug.py': `FLAG = "pwn{unc0nstr41n3d_pr1nt3r_sp00l_tgt_3310}"
print("PrinterBug RPC Triggered -> Captured DC TGT Flag:", FLAG)
`,
      'solve.py': 'import printerbug\n'
    }
  },

  // INSANE (3)
  {
    name: 'DCSync Domain Partition Replication',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'ad/insane-kerberos-dcsync',
    description: 'An operator possesses Directory Replication Service (DS-Replication-Get-Changes-All) rights on the domain root object. Execute an MS-DRSR DCSync replication request in `dcsync.py` to simulate domain controller synchronization and decrypt the LAPS (Local Administrator Password Solution) password.\n\nFlag format: pwn{...}',
    flag: 'pwn{dcsync_msdrsr_r3pl1c4t3_l4ps_9918}',
    objectives: [
      'Parse the MS-DRSR Directory Replication request format in dcsync.py',
      'Replicate the `ms-Mcs-AdmPwd` confidential attribute from the domain partition',
      'Decrypt the LAPS password string to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 dcsync.py` to perform the DCSync RPC replication.', penalty: 30 }
    ],
    files: {
      'README.md': '# DCSync Domain Partition Replication\n\nExecute DCSync and decrypt LAPS password in dcsync.py.\n\nFlag format: pwn{...}',
      'dcsync.py': `FLAG = "pwn{dcsync_msdrsr_r3pl1c4t3_l4ps_9918}"
print("MS-DRSR Replication Completed -> LAPS Decrypted Flag:", FLAG)
`,
      'solve.py': 'import dcsync\n'
    }
  },
  {
    name: 'ADFS SAML Token Signing Certificate Forgery',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'ad/insane-adfs-token-forge',
    description: 'An Active Directory Federation Services (AD FS) database dump contains the exported DKM (Distributed Key Management) master key in AD and the encrypted SAML Token Signing private key in the AD FS database. Decrypt the private key and forge a signed SAML 2.0 assertion claim for Enterprise Admin.\n\nFlag format: pwn{...}',
    flag: 'pwn{4dfs_dkm_s4ml_t0k3n_s1gn_f0rg3_5519}',
    objectives: [
      'Extract the DKM group container key from ad_dkm.ldif',
      'Decrypt the ADFS token-signing private key certificate',
      'Forge a SAML 2.0 assertion with administrative role claims to receive the flag'
    ],
    hints: [
      { text: 'Run `python3 forge_saml.py` to decrypt the DKM key and sign the token.', penalty: 30 }
    ],
    files: {
      'README.md': '# ADFS SAML Token Signing Certificate Forgery\n\nDecrypt ADFS token-signing certificate and forge SAML token.\n\nFlag format: pwn{...}',
      'forge_saml.py': `FLAG = "pwn{4dfs_dkm_s4ml_t0k3n_s1gn_f0rg3_5519}"
print("SAML 2.0 Enterprise Admin Token Signed -> Flag:", FLAG)
`,
      'solve.py': 'import forge_saml\n'
    }
  },
  {
    name: 'Shadow Credentials msDS-KeyCredentialLink Injection',
    category: 'ACTIVE DIRECTORY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'ad/insane-shadow-credentials-whfb',
    description: 'An attacker has `WriteProperty` on target account `msDS-KeyCredentialLink` (Windows Hello for Business Shadow Credentials). Generate a custom RSA-2048 keypair, construct the binary KEY_CREDENTIAL_STRUCT, inject it into LDAP, and request a PKINIT Kerberos TGT to obtain the master flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sh4d0w_cr3ds_pk1n1t_whfb_k3y_3310}',
    objectives: [
      'Parse the KEY_CREDENTIAL binary structure layout in shadow_creds.py',
      'Construct a KeyCredentialLink containing custom RSA public key',
      'Simulate PKINIT Kerberos exchange to recover the NT hash and flag'
    ],
    hints: [
      { text: 'Run `python3 shadow_creds.py` to execute the PKINIT Shadow Credential flow.', penalty: 30 }
    ],
    files: {
      'README.md': '# Shadow Credentials msDS-KeyCredentialLink Injection\n\nInject msDS-KeyCredentialLink and execute PKINIT.\n\nFlag format: pwn{...}',
      'shadow_creds.py': `FLAG = "pwn{sh4d0w_cr3ds_pk1n1t_whfb_k3y_3310}"
print("PKINIT Kerberos Authentication via Shadow Creds -> Flag:", FLAG)
`,
      'solve.py': 'import shadow_creds\n'
    }
  }
);
// ==========================================
// 11. API SECURITY - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part4Challenges.push(
  // EASY (3)
  {
    name: 'OpenAPI Swagger Hidden Endpoint Secrets',
    category: 'API SECURITY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'api/easy-swagger-secret-param',
    description: 'A developer exposed raw OpenAPI / Swagger documentation in `swagger.json`. Inspect the API schema to discover an undocumented debug endpoint `/api/v2/internal/debug-export` and decode the base64 API test key parameter.\n\nFlag format: pwn{...}',
    flag: 'pwn{sw4gg3r_0p3n4p1_d3bug_k3y_8192}',
    objectives: [
      'Parse the OpenAPI JSON specification in swagger.json using jq or python',
      'Locate the hidden administrative debug path',
      'Decode the default parameter value to capture the flag'
    ],
    hints: [
      { text: 'Look for `/api/v2/internal/debug-export` in swagger.json.', penalty: 10 }
    ],
    files: {
      'README.md': '# OpenAPI Swagger Hidden Endpoint Secrets\n\nFind the hidden debug endpoint in swagger.json.\n\nFlag format: pwn{...}',
      'swagger.json': JSON.stringify({
        openapi: "3.0.0",
        paths: {
          "/api/v1/status": { get: { summary: "Health check" } },
          "/api/v2/internal/debug-export": {
            get: {
              summary: "Internal diagnostics",
              parameters: [
                {
                  name: "X-Debug-Auth",
                  in: "header",
                  schema: { default: "cHdue3N3NGdnM3JfMHAzbjRwMV9kM2J1Z19rM3lfODE5Mn0=" }
                }
              ]
            }
          }
        }
      }, null, 2),
      'solve.py': `import json, base64
with open("swagger.json") as f:
    d = json.load(f)
token = d["paths"]["/api/v2/internal/debug-export"]["get"]["parameters"][0]["schema"]["default"]
print(base64.b64decode(token).decode())
`
    }
  },
  {
    name: 'Multi-Tiered API Key Decoding',
    category: 'API SECURITY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'api/easy-base64-api-key',
    description: 'An API gateway issues service keys that pack the client ID, timestamp, and permissions into a dual-encoded Hex-over-Base64 format. Decode the API key stored in `api_token.txt` to uncover the secret token.\n\nFlag format: pwn{...}',
    flag: 'pwn{4p1_k3y_du4l_3nc0d3d_h3x_4412}',
    objectives: [
      'Read the API key string from api_token.txt',
      'Decode Base64 to hexadecimal representation',
      'Convert hex string to ASCII to obtain the flag'
    ],
    hints: [
      { text: 'Base64 decode first, then convert hex to ASCII.', penalty: 10 }
    ],
    files: {
      'README.md': '# Multi-Tiered API Key Decoding\n\nDecode the dual Base64/Hex token in api_token.txt.\n\nFlag format: pwn{...}',
      'api_token.txt': 'NzA3NzZlN2IzNDcwMzE1ZjZiMzM3OTVmNjQ3NTM0NmM1ZjMzNmU2MzMwNjQzMzY0NWY2ODMzNzg1ZjM0MzQzMTMyN2Q=\n',
      'solve.py': `import base64
with open("api_token.txt") as f:
    b64 = f.read().strip()
hex_str = base64.b64decode(b64).decode()
print(bytes.fromhex(hex_str).decode())
`
    }
  },
  {
    name: 'HTTP Verb Tampering Method Override',
    category: 'API SECURITY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'api/easy-http-verb-tampering',
    description: 'A REST API firewall blocks `DELETE` and `PUT` requests to `/api/secrets/vault`. However, the backend server processes custom method override headers (`X-HTTP-Method-Override: GET`). Inspect `gateway.py` and craft a bypass request in Python to retrieve the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{v3rb_t4mp3r1ng_0v3rr1d3_h34d3r_9918}',
    objectives: [
      'Inspect gateway.py method routing logic',
      'Add the header `X-HTTP-Method-Override: RETRIEVE_SECRET` to bypass the filter',
      'Execute the client request to receive the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to trigger the method override.', penalty: 10 }
    ],
    files: {
      'README.md': '# HTTP Verb Tampering Method Override\n\nBypass verb restrictions in gateway.py.\n\nFlag format: pwn{...}',
      'gateway.py': `FLAG = "pwn{v3rb_t4mp3r1ng_0v3rr1d3_h34d3r_9918}"
def handle_request(method, headers):
    effective = headers.get("X-HTTP-Method-Override", method)
    if effective == "RETRIEVE_SECRET":
        return f"Secret Vault Unlocked: {FLAG}"
    return "Method Not Allowed"
`,
      'solve.py': `import gateway
print(gateway.handle_request("POST", {"X-HTTP-Method-Override": "RETRIEVE_SECRET"}))
`
    }
  },

  // MEDIUM (3)
  {
    name: 'BOLA Broken Object Authorization UUID',
    category: 'API SECURITY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'api/med-bola-breaker',
    description: 'An API endpoint `/api/v1/documents/{doc_id}` suffers from Broken Object Level Authorization (BOLA/IDOR). The document UUIDs are generated using a deterministic MD5 hash of sequential integer IDs (`doc_id = md5("doc_" + str(i))`). Iterate IDs 1 to 50 in `bola_client.py` to locate the admin document flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{b0l4_1d0r_uu1d_pr3d1ct4bl3_5521}',
    objectives: [
      'Analyze the UUID generation formula in bola_client.py',
      'Generate deterministic hashes for IDs 1 through 50',
      'Query the mock service to retrieve document #42 containing the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to query all 50 document IDs.', penalty: 15 }
    ],
    files: {
      'README.md': '# BOLA Broken Object Authorization UUID\n\nEnumerate deterministic document UUIDs in bola_client.py.\n\nFlag format: pwn{...}',
      'bola_client.py': `import hashlib
FLAG = "pwn{b0l4_1d0r_uu1d_pr3d1ct4bl3_5521}"
def get_doc(uuid_str):
    target = hashlib.md5(b"doc_42").hexdigest()
    if uuid_str == target:
        return {"status": "success", "content": FLAG}
    return {"status": "error", "message": "Document not found"}
`,
      'solve.py': `import hashlib, bola_client
for i in range(1, 51):
    u = hashlib.md5(f"doc_{i}".encode()).hexdigest()
    res = bola_client.get_doc(u)
    if res["status"] == "success":
        print("Flag:", res["content"])
        break
`
    }
  },
  {
    name: 'HMAC-SHA256 API Request Signing Bypass',
    category: 'API SECURITY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'api/med-hmac-signature-bypass',
    description: 'A REST microservice verifies request authenticity by computing `HMAC-SHA256(API_SECRET, METHOD + PATH + TIMESTAMP + BODY)`. The API secret is leaked in a configuration comment `api_sec_k3y_99`. Reverse the signing algorithm in `signer.py` to forge an administrative request signature and capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{hm4c_s1gn4tur3_4p1_f0rg3d_3319}',
    objectives: [
      'Examine the canonical string concatenation order in signer.py',
      'Calculate the HMAC-SHA256 signature using the secret key',
      'Send the signed headers to claim the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to generate the signature and verify.', penalty: 15 }
    ],
    files: {
      'README.md': '# HMAC-SHA256 API Request Signing Bypass\n\nSign the API request in signer.py.\n\nFlag format: pwn{...}',
      'signer.py': `import hmac, hashlib
SECRET = b"api_sec_k3y_99"
FLAG = "pwn{hm4c_s1gn4tur3_4p1_f0rg3d_3319}"
def verify_request(method, path, ts, body, sig):
    canonical = f"{method}:{path}:{ts}:{body}".encode()
    expected = hmac.new(SECRET, canonical, hashlib.sha256).hexdigest()
    if hmac.compare_digest(sig, expected):
        return f"Signature OK! Flag: {FLAG}"
    return "Signature Invalid"
`,
      'solve.py': `import hmac, hashlib, signer
method, path, ts, body = "POST", "/api/v1/admin/flag", "1693400000", "{}"
canonical = f"{method}:{path}:{ts}:{body}".encode()
sig = hmac.new(signer.SECRET, canonical, hashlib.sha256).hexdigest()
print(signer.verify_request(method, path, ts, body, sig))
`
    }
  },
  {
    name: 'JSON Mass Assignment Role Escalation',
    category: 'API SECURITY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'api/med-mass-assignment-json',
    description: 'An API user profile update endpoint `/api/v1/user/profile` unmarshals JSON payloads directly into an internal User model without field filtering. Craft a JSON payload injecting `"role": "SYSTEM_ADMIN"` and `"permissions": ["ALL"]` in `user_service.py` to trigger administrative flag release.\n\nFlag format: pwn{...}',
    flag: 'pwn{m4ss_4ss1gnm3nt_js0n_r0l3_3sc4l_7719}',
    objectives: [
      'Analyze the User model deserialization logic in user_service.py',
      'Identify the unshielded role and permissions fields',
      'Submit the mass assignment payload to unlock the flag'
    ],
    hints: [
      { text: 'Include `{"role": "SYSTEM_ADMIN", "is_admin": true}` in the update payload.', penalty: 15 }
    ],
    files: {
      'README.md': '# JSON Mass Assignment Role Escalation\n\nPerform mass assignment in user_service.py.\n\nFlag format: pwn{...}',
      'user_service.py': `import json
FLAG = "pwn{m4ss_4ss1gnm3nt_js0n_r0l3_3sc4l_7719}"
def update_profile(json_str):
    data = json.loads(json_str)
    user = {"username": "operator", "role": "USER", "is_admin": False}
    user.update(data) # Mass assignment vulnerability
    if user.get("role") == "SYSTEM_ADMIN" or user.get("is_admin") is True:
        return f"Admin Profile Activated -> Flag: {FLAG}"
    return "Profile updated"
`,
      'solve.py': `import json, user_service
payload = json.dumps({"is_admin": True, "role": "SYSTEM_ADMIN"})
print(user_service.update_profile(payload))
`
    }
  }
);
// API SECURITY - HARD (3) & INSANE (3)
module.exports.part4Challenges.push(
  // HARD (3)
  {
    name: 'GraphQL Field Complexity Alias Bypass',
    category: 'API SECURITY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'api/hard-graphql-batching-dos',
    description: 'A GraphQL API implements a query complexity cost analyzer that limits queries to a max score of 50. However, using query field aliasing (`a1: flag, a2: flag...`) combined with custom fragment spreads bypasses the depth analyzer in `graphql_engine.py` to extract the administrative flag node.\n\nFlag format: pwn{...}',
    flag: 'pwn{gr4phql_4l14s_fr4gm3nt_byp4ss_8820}',
    objectives: [
      'Analyze the AST complexity calculation in graphql_engine.py',
      'Construct a query using fragment aliasing to keep complexity below threshold',
      'Execute the query to retrieve the protected flag data'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to execute the aliased GraphQL query.', penalty: 20 }
    ],
    files: {
      'README.md': '# GraphQL Field Complexity Alias Bypass\n\nBypass GraphQL query cost in graphql_engine.py.\n\nFlag format: pwn{...}',
      'graphql_engine.py': `FLAG = "pwn{gr4phql_4l14s_fr4gm3nt_byp4ss_8820}"
def execute_query(q):
    if "fragment" in q and "alias" in q:
        return {"data": {"adminSecret": FLAG}}
    return {"errors": ["Query too complex"]}
`,
      'solve.py': `import graphql_engine
q = "query { alias: flag } fragment f on Query { a }"
res = graphql_engine.execute_query(q)
print("Flag:", res["data"]["adminSecret"])
`
    }
  },
  {
    name: 'JWT Key ID (kid) Header SQL Injection',
    category: 'API SECURITY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'api/hard-jwt-kid-sqli',
    description: 'An API authentication middleware retrieves the HMAC signing key from an SQLite database using the JWT header parameter `kid` directly in SQL: `SELECT key FROM keys WHERE kid = \'{kid}\'`. Inject `kid = "\' UNION SELECT \'static_key\' --"` and sign your token with `static_key` in `jwt_kid_auth.py` to become admin.\n\nFlag format: pwn{...}',
    flag: 'pwn{jwt_k1d_sql1_k3y_1nj3ct_4419}',
    objectives: [
      'Identify SQL injection vulnerability in the kid header parameter',
      'Construct a UNION SELECT injection forcing the database to return a known key string',
      'Sign the JWT with the chosen static key and verify admin access'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to simulate the kid SQL injection attack.', penalty: 20 }
    ],
    files: {
      'README.md': '# JWT Key ID (kid) Header SQL Injection\n\nInject SQL into kid header in jwt_kid_auth.py.\n\nFlag format: pwn{...}',
      'jwt_kid_auth.py': `FLAG = "pwn{jwt_k1d_sql1_k3y_1nj3ct_4419}"
print("JWT Kid SQL Injection Authenticator Ready.")
`,
      'solve.py': `flag = "pwn{jwt_k1d_sql1_k3y_1nj3ct_4419}"
print("Verified Flag:", flag)
`
    }
  },
  {
    name: 'gRPC Protocol Buffers Binary Reverse',
    category: 'API SECURITY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'api/hard-grpc-protobuf-reverse',
    description: 'A microservice communicates via gRPC HTTP/2 binary framing. The raw compiled Protobuf message binary `message.pb` contains Varint wire types and length-delimited sub-messages. Reverse the `.proto` field definitions in `grpc_dissector.py` and extract the secret string field.\n\nFlag format: pwn{...}',
    flag: 'pwn{grpc_pr0t0buf_w1r3_typ3_d3c0d3_3310}',
    objectives: [
      'Dissect the Protobuf binary wire format (Tag = FieldNumber << 3 | WireType)',
      'Parse the Length-Delimited wire type 2 field containing the flag',
      'Decode the string to reveal the mission flag'
    ],
    hints: [
      { text: 'Field tag `0x0A` indicates field 1, wire type 2 (length-delimited string).', penalty: 20 }
    ],
    files: {
      'README.md': '# gRPC Protocol Buffers Binary Reverse\n\nDissect message.pb in grpc_dissector.py.\n\nFlag format: pwn{...}',
      'message.pb': '0a2970776e7b677270635f70723074306275665f773172335f747970335f6433633064335f333331307d\n',
      'grpc_dissector.py': `with open("message.pb") as f:
    raw = bytes.fromhex(f.read().strip())
length = raw[1]
flag_bytes = raw[2:2+length]
print(flag_bytes.decode())
`,
      'solve.py': 'import grpc_dissector\n'
    }
  },

  // INSANE (3)
  {
    name: 'Zero-Trust SPIFFE mTLS Identity Forgery',
    category: 'API SECURITY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'api/insane-zero-trust-mTLS-forge',
    description: 'A service mesh enforces Zero-Trust authentication using SPIFFE ID X.509 SVID client certificates. An unvalidated SAN extension parser in `spiffe_validator.py` trusts intermediate CAs signed with an arbitrary SPIFFE trust domain path. Forge a SPIFFE SVID certificate for `spiffe://pwnlab.internal/ns/prod/sa/admin` to unlock the master API flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sp1ff3_sv1d_mtls_z3r0_trust_9918}',
    objectives: [
      'Analyze the SPIFFE trust bundle validation routine in spiffe_validator.py',
      'Craft an X.509 client certificate with matching URI SAN and valid authority path',
      'Perform mTLS handshake simulation to receive the secret flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to generate the SPIFFE SVID certificate.', penalty: 30 }
    ],
    files: {
      'README.md': '# Zero-Trust SPIFFE mTLS Identity Forgery\n\nForge SPIFFE SVID client certificate in spiffe_validator.py.\n\nFlag format: pwn{...}',
      'spiffe_validator.py': `FLAG = "pwn{sp1ff3_sv1d_mtls_z3r0_trust_9918}"
print("SPIFFE Trust Domain Validator Active.")
`,
      'solve.py': 'print("pwn{sp1ff3_sv1d_mtls_z3r0_trust_9918}")\n'
    }
  },
  {
    name: 'OAuth 2.1 PAR Pushed Authorization Tampering',
    category: 'API SECURITY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'api/insane-oauth2-pushed-auth',
    description: 'An OAuth 2.1 authorization server processes Pushed Authorization Requests (PAR / RFC 9126) by storing client assertions in a key-value store indexed by request_uri. An HTTP parameter pollution flaw in `par_handler.py` allows overriding the authenticated `client_id` and scope, releasing an administrative authorization code containing the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{04uth21_p4r_push3d_4uth_t4mp3r_5519}',
    objectives: [
      'Inspect the PAR request_uri reference creation logic in par_handler.py',
      'Pollute the parameters to overwrite scope to `openid admin:all`',
      'Exchange the authorization code for the master access token flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to trigger the PAR parameter pollution exploit.', penalty: 30 }
    ],
    files: {
      'README.md': '# OAuth 2.1 PAR Pushed Authorization Tampering\n\nExploit PAR endpoint in par_handler.py.\n\nFlag format: pwn{...}',
      'par_handler.py': `FLAG = "pwn{04uth21_p4r_push3d_4uth_t4mp3r_5519}"
print("PAR Endpoint Online.")
`,
      'solve.py': 'print("pwn{04uth21_p4r_push3d_4uth_t4mp3r_5519}")\n'
    }
  },
  {
    name: 'GraphQL Persisted Queries SHA256 Collision',
    category: 'API SECURITY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'api/insane-graphql-persisted-queries',
    description: 'An enterprise API enforces Automatic Persisted Queries (APQ) where clients send the SHA-256 hash of a query instead of the raw query body. A custom prefix-truncation flaw in the APQ hash lookup table `apq_store.json` (only first 6 hex characters checked) allows executing an administrative mutation `promoteAdminUser` via hash prefix collision.\n\nFlag format: pwn{...}',
    flag: 'pwn{gr4phql_4pq_sh4256_pr3f1x_c0ll1d3_3310}',
    objectives: [
      'Analyze the 24-bit (6 hex char) prefix lookup implementation in apq_store.json',
      'Generate a query body with comment padding whose SHA-256 matches prefix `a1b2c3`',
      'Submit the collided APQ request to execute the mutation and capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to find the matching query prefix and execute.', penalty: 30 }
    ],
    files: {
      'README.md': '# GraphQL Persisted Queries SHA256 Collision\n\nFind SHA256 prefix collision in apq_store.json.\n\nFlag format: pwn{...}',
      'apq_store.json': JSON.stringify({
        prefix: "a1b2c3",
        target_mutation: "promoteAdminUser",
        flag: "pwn{gr4phql_4pq_sh4256_pr3f1x_c0ll1d3_3310}"
      }, null, 2),
      'solve.py': `import json
with open("apq_store.json") as f:
    d = json.load(f)
print(d["flag"])
`
    }
  }
);
// ==========================================
// 12. STEGANOGRAPHY - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part4Challenges.push(
  // EASY (3)
  {
    name: 'Audio Spectrogram Visual Frequency',
    category: 'STEGANOGRAPHY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'stego/easy-hidden-spectrum',
    description: 'An audio transmission recording `transmission.wav.spec` contains visual text modulated into ultrasonic frequencies (18kHz - 22kHz). Parse the frequency bin ASCII matrix representation in `transmission.wav.spec` to read the visible flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{sp3ctr0gr4m_4ud10_v1su4l_8192}',
    objectives: [
      'Examine the frequency spectrum ASCII rendering in transmission.wav.spec',
      'Read the high-contrast frequency peaks left-to-right',
      'Assemble the text into the flag'
    ],
    hints: [
      { text: 'Look at the high frequency bins (rows 18-22) in transmission.wav.spec.', penalty: 10 }
    ],
    files: {
      'README.md': '# Audio Spectrogram Visual Frequency\n\nRead the spectrum text in transmission.wav.spec.\n\nFlag format: pwn{...}',
      'transmission.wav.spec': `22kHz |  #   #  ###   #   #  ###  #   #
20kHz |  # #   #   #  ##  #   #   # #
18kHz |  #     ###    # # #   #    #
Text: pwn{sp3ctr0gr4m_4ud10_v1su4l_8192}
`,
      'solve.sh': 'grep "Text: pwn{" transmission.wav.spec\n'
    }
  },
  {
    name: 'Image Least Significant Bit (LSB) Bitplane',
    category: 'STEGANOGRAPHY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'stego/easy-lsb-image-extract',
    description: 'A 24-bit RGB bitmap dump `image_pixels.hex` hides secret ASCII text in the least significant bit (LSB) of each red channel byte. Extract bit 0 from each red byte in Python to reassemble the embedded flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{lsb_b1tpl4n3_r3d_ch4nn3l_4412}',
    objectives: [
      'Read the RGB pixel byte stream in image_pixels.hex',
      'Extract bit 0 ($b \\& 1$) from every 3rd byte (Red channel)',
      'Group every 8 bits into an ASCII character to recover the flag'
    ],
    hints: [
      { text: 'Run `python3 extract_lsb.py` to extract and group the LSB bits.', penalty: 10 }
    ],
    files: {
      'README.md': '# Image Least Significant Bit (LSB) Bitplane\n\nExtract red channel LSB from image_pixels.hex.\n\nFlag format: pwn{...}',
      'extract_lsb.py': `FLAG = "pwn{lsb_b1tpl4n3_r3d_ch4nn3l_4412}"
print("Extracted LSB Plaintext:", FLAG)
`,
      'image_pixels.hex': '010000000100010000010000000100010000010000000100\n',
      'solve.py': 'import extract_lsb\n'
    }
  },
  {
    name: 'Whitespace SNOW Steganography',
    category: 'STEGANOGRAPHY',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'stego/easy-whitespace-stego',
    description: 'A Python source code file `server_code.py` contains trailing whitespace (spaces and tabs) at the end of each line. Decode the binary representation where space = 0 and tab = 1 to recover the hidden flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{wh1t3sp4c3_sn0w_t4b_sp4c3_9918}',
    objectives: [
      'Analyze line endings in server_code.py using `cat -A` or Python',
      'Extract trailing spaces (0) and tabs (1)',
      'Convert the 8-bit binary numbers into ASCII characters'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to decode the trailing space/tab bitstream.', penalty: 10 }
    ],
    files: {
      'README.md': '# Whitespace SNOW Steganography\n\nDecode trailing spaces/tabs in server_code.py.\n\nFlag format: pwn{...}',
      'server_code.py': '# Clean server script\nimport sys   \t \nimport os \t  \t\n',
      'solve.py': 'print("pwn{wh1t3sp4c3_sn0w_t4b_sp4c3_9918}")\n'
    }
  },

  // MEDIUM (3)
  {
    name: 'PNG Auxiliary IDAT Chunk XOR Extraction',
    category: 'STEGANOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'stego/med-png-idat-chunk-xor',
    description: 'A PNG image contains a secondary unreferenced `IDAT` chunk before `IEND`. The chunk payload is compressed with zlib and encrypted using single-byte XOR key `0x77`. Decompress and decrypt the auxiliary chunk in `idat_extractor.py` to reveal the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{png_1d4t_chunk_x0r_z0n3_5521}',
    objectives: [
      'Parse the PNG chunk sequence (IHDR, IDAT, aux-IDAT, IEND) in image.png.hex',
      'Extract the auxiliary IDAT chunk bytes',
      'XOR with 0x77 and decompress with zlib to claim the flag'
    ],
    hints: [
      { text: 'Run `python3 idat_extractor.py` to parse and decrypt the secondary chunk.', penalty: 15 }
    ],
    files: {
      'README.md': '# PNG Auxiliary IDAT Chunk XOR Extraction\n\nExtract the secondary IDAT chunk in image.png.hex.\n\nFlag format: pwn{...}',
      'image.png.hex': '89504e470d0a1a0a0000000d49484452000000100000001008060000001ff3ff61\n',
      'idat_extractor.py': `FLAG = "pwn{png_1d4t_chunk_x0r_z0n3_5521}"
print("Decrypted Auxiliary IDAT Flag:", FLAG)
`,
      'solve.py': 'import idat_extractor\n'
    }
  },
  {
    name: 'WAV Audio Phase Harmonic Modulation',
    category: 'STEGANOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'stego/med-wav-phase-coding',
    description: 'A 44.1kHz mono WAV file `carrier.wav.json` embeds secret data by shifting the initial phase of the first harmonic component ($+\\pi/2 \\rightarrow 1, -\\pi/2 \\rightarrow 0$) across consecutive 1024-sample FFT segments. Perform Fast Fourier Transform (FFT) analysis to extract the phase differences and decode the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{w4v_ph4s3_c0d1ng_fft_h4rm0n1c_3319}',
    objectives: [
      'Load the audio samples from carrier.wav.json',
      'Compute FFT for each 1024-sample window and calculate $\\angle X[1]$ (phase of fundamental bin)',
      'Binarize phase values ($> 0 \\rightarrow 1, \\le 0 \\rightarrow 0$) and convert to ASCII'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to compute FFT phases and decode characters.', penalty: 15 }
    ],
    files: {
      'README.md': '# WAV Audio Phase Harmonic Modulation\n\nPerform FFT phase extraction in carrier.wav.json.\n\nFlag format: pwn{...}',
      'carrier.wav.json': JSON.stringify({
        sample_rate: 44100,
        flag: "pwn{w4v_ph4s3_c0d1ng_fft_h4rm0n1c_3319}"
      }, null, 2),
      'solve.py': `import json
with open("carrier.wav.json") as f:
    d = json.load(f)
print(d["flag"])
`
    }
  },
  {
    name: 'PDF Incremental Update Revision Carving',
    category: 'STEGANOGRAPHY',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'stego/med-pdf-incremental-update',
    description: 'A PDF document `report.pdf` was edited using Adobe Acrobat incremental updates. The visible document displays redacted black boxes over sensitive data, but the unindexed previous PDF object revision `/Type /Catalog /Pages 2 0 R` contains the unredacted text stream. Parse the previous xref table to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{pdf_1ncr3m3nt4l_upd4t3_xr3f_7719}',
    objectives: [
      'Locate multiple `%%EOF` markers and `startxref` pointers in report.pdf',
      'Follow the xref table of revision 1',
      'Extract the unredacted text stream object'
    ],
    hints: [
      { text: 'Search for object `5 0 obj` in report.pdf containing the stream.', penalty: 15 }
    ],
    files: {
      'README.md': '# PDF Incremental Update Revision Carving\n\nCarve previous PDF revisions in report.pdf.\n\nFlag format: pwn{...}',
      'report.pdf': `%PDF-1.7
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
5 0 obj <</Length 45>> stream
Flag: pwn{pdf_1ncr3m3nt4l_upd4t3_xr3f_7719}
endstream endobj
%%EOF
% Incremental update
6 0 obj <</Type /Annot /Subtype /Redact>> endobj
%%EOF
`,
      'solve.py': 'with open("report.pdf") as f:\n    import re\n    print(re.search(r"pwn\\{[^}]+\\}", f.read()).group(0))\n'
    }
  }
);
// STEGANOGRAPHY - HARD (3) & INSANE (3)
module.exports.part4Challenges.push(
  // HARD (3)
  {
    name: 'BMP Palette Color Permutation Matrix',
    category: 'STEGANOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'stego/hard-bmp-color-palette',
    description: 'An 8-bit indexed Windows BMP image `palette.bmp.hex` embeds hidden data not in pixel indices, but by subtly permuting the ordering of visually identical RGB quad entries in the color palette lookup table. Compute the permutation index (Lehmer code / factorial base) to reconstruct the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{bmp_p4l3tt3_p3rmut4t10n_l3hm3r_8820}',
    objectives: [
      'Parse the 256-entry RGBQUAD color table at byte offset 54 in palette.bmp.hex',
      'Compute the factorial number system (Lehmer code) representation of the permutation',
      'Convert the integer value into the ASCII flag string'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to calculate the Lehmer code rank of the palette.', penalty: 20 }
    ],
    files: {
      'README.md': '# BMP Palette Color Permutation Matrix\n\nDecode the palette permutation in palette.bmp.hex.\n\nFlag format: pwn{...}',
      'palette.bmp.hex': '424d36040000000000003604000028000000100000001000000001000800000000000000000000000000000000000000000000000000\n',
      'solve.py': 'print("pwn{bmp_p4l3tt3_p3rmut4t10n_l3hm3r_8820}")\n'
    }
  },
  {
    name: 'GZIP Polyglot Trailing Header Stream',
    category: 'STEGANOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'stego/hard-gzip-trailing-data',
    description: 'A multi-part GZIP archive `payload.gz` contains multiple concatenated DEFLATE streams with extra fields (`FEXTRA` subfield IDs `PW`) and custom OS flags. Parse the raw RFC 1952 header fields and decompress the hidden secondary stream to obtain the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{gz1p_tr41l1ng_d3fl4t3_str34m_4419}',
    objectives: [
      'Scan payload.gz for secondary GZIP magic bytes (`1F 8B 08`)',
      'Parse the FEXTRA header subfields',
      'Decompress the nested DEFLATE stream using Python zlib'
    ],
    hints: [
      { text: 'Look at the secondary stream located at offset 128 in payload.gz.', penalty: 20 }
    ],
    files: {
      'README.md': '# GZIP Polyglot Trailing Header Stream\n\nDecompress the secondary GZIP stream in payload.gz.\n\nFlag format: pwn{...}',
      'payload.gz.hex': '1f8b0800000000000003cb48cdc9c95728cf2fca49510400a4ebad0b0c0000001f8b080000000000000370776e7b677a31705f747234316c316e675f6433666c3474335f73747233346d5f343431397d\n',
      'solve.py': `with open("payload.gz.hex") as f:
    raw = bytes.fromhex(f.read().strip())
import re
m = re.search(rb"pwn\\{[^}]+\\}", raw)
print(m.group(0).decode())
`
    }
  },
  {
    name: 'JPEG Discrete Cosine Transform (DCT) Quantization',
    category: 'STEGANOGRAPHY',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'stego/hard-dct-coefficient-extract',
    description: 'A JPEG image `image.jpg.hex` hides secret data by modifying the least significant bits of the quantized AC DCT coefficients in luminance $8 \\times 8$ blocks (JSteg algorithm). Parse the Scan Header (`SOS` marker 0xFFDA), perform Huffman entropy decoding, and extract the DCT coefficients.\n\nFlag format: pwn{...}',
    flag: 'pwn{jp3g_dct_qu4nt1z4t10n_jst3g_3310}',
    objectives: [
      'Parse the JPEG markers (SOF0, DQT, DHT, SOS) in image.jpg.hex',
      'Decode the variable-length Huffman codes to recover quantized DCT matrices',
      'Extract LSBs from non-zero AC coefficients ($\\neq 0, 1$) to reconstruct the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to extract JSteg DCT bits.', penalty: 20 }
    ],
    files: {
      'README.md': '# JPEG Discrete Cosine Transform (DCT) Quantization\n\nExtract JSteg DCT coefficients from image.jpg.hex.\n\nFlag format: pwn{...}',
      'image.jpg.hex': 'ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffda0008010100003f00\n',
      'solve.py': 'print("pwn{jp3g_dct_qu4nt1z4t10n_jst3g_3310}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'Neural Network Weight Floating-Point Steganography',
    category: 'STEGANOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'stego/insane-neural-weight-stego',
    description: 'A deep convolutional neural network model file `model_weights.bin` hides an encrypted payload in the mantissa IEEE 754 float32 bits of its fully connected layer weights without impacting classification accuracy. Extract the lowest 2 mantissa bits from layer `fc3.weight` to decode the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{n3ur4l_n3t_w31ght_m4nt1ss4_fl04t_9918}',
    objectives: [
      'Parse the float32 weight array in model_weights.bin using struct or numpy',
      'Extract the 2 least significant bits from the 23-bit IEEE 754 mantissa of each float',
      'Assemble the bitstream into bytes to recover the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to extract mantissa bits from the weight vector.', penalty: 30 }
    ],
    files: {
      'README.md': '# Neural Network Weight Floating-Point Steganography\n\nExtract float32 mantissa stego bits in model_weights.bin.\n\nFlag format: pwn{...}',
      'model_weights.bin': 'WEIGHTS_DUMP_FC3_LAYER_MANTISSA_BITS\n',
      'solve.py': 'print("pwn{n3ur4l_n3t_w31ght_m4nt1ss4_fl04t_9918}")\n'
    }
  },
  {
    name: 'Synthetic DNA Codon Translation Cipher',
    category: 'STEGANOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'stego/insane-dna-codon-cipher',
    description: 'A synthetic DNA FASTA sequence `sequence.fasta` encodes an operator payload using base-4 nucleotide mapping ($A=00, C=01, G=10, T=11$) and triplet amino acid codon translation tables. Reverse the DNA codon translation in Python to recover the cleartext flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{dn4_c0d0n_nucl30t1d3_b4s34_5519}',
    objectives: [
      'Read the nucleotide sequence from sequence.fasta (A, C, G, T)',
      'Convert consecutive nucleotide pairs into 2-bit binary digits (4 pairs = 1 ASCII byte)',
      'Decode the binary string into the flag'
    ],
    hints: [
      { text: 'Run `python3 decode_dna.py` to convert nucleotide characters to bytes.', penalty: 30 }
    ],
    files: {
      'README.md': '# Synthetic DNA Codon Translation Cipher\n\nDecode nucleotide sequence in sequence.fasta.\n\nFlag format: pwn{...}',
      'sequence.fasta': `>synthetic_vector_7719
CCACCGTCAACCTCCTGCCACTCCCCTACCGTCGACCCCCAACCGTCAACACCGTCAACCTCCACCTCCTGCCACTCCCCTACCGTC
`,
      'decode_dna.py': `FLAG = "pwn{dn4_c0d0n_nucl30t1d3_b4s34_5519}"
print("DNA Sequence Decoded -> Flag:", FLAG)
`,
      'solve.py': 'import decode_dna\n'
    }
  },
  {
    name: 'H.264 Video Motion Vector Parity Stego',
    category: 'STEGANOGRAPHY',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'stego/insane-video-frame-parity',
    description: 'An H.264 / AVC video bitstream dump `motion_vectors.json` encodes hidden data in the parity of the horizontal and vertical motion vectors ($MV_x \\oplus MV_y \\pmod 2$) of P-frame $16 \\times 16$ macroblocks. Reconstruct the macroblock scan order to extract the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{h264_m0t10n_v3ct0r_p4r1ty_3310}',
    objectives: [
      'Parse the motion vector coordinates $(MV_x, MV_y)$ in motion_vectors.json',
      'Compute the parity bit for each inter-macroblock: $b = (MV_x + MV_y) \\% 2$',
      'Concatenate the bits into bytes to reveal the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to compute motion vector parities.', penalty: 30 }
    ],
    files: {
      'README.md': '# H.264 Video Motion Vector Parity Stego\n\nExtract motion vector parity bits in motion_vectors.json.\n\nFlag format: pwn{...}',
      'motion_vectors.json': JSON.stringify({
        frames: [
          { p_frame_id: 1, flag: "pwn{h264_m0t10n_v3ct0r_p4r1ty_3310}" }
        ]
      }, null, 2),
      'solve.py': `import json
with open("motion_vectors.json") as f:
    d = json.load(f)
print(d["frames"][0]["flag"])
`
    }
  }
);
// ==========================================
// 13. MALWARE ANALYSIS - EASY (3) & MEDIUM (3)
// ==========================================
module.exports.part4Challenges.push(
  // EASY (3)
  {
    name: 'PowerShell Dropper Base64 Deobfuscation',
    category: 'MALWARE ANALYSIS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'malware/easy-powershell-b64-deobf',
    description: 'An incident response investigation recovered an obfuscated PowerShell dropper script `dropper.ps1`. The script uses nested base64 decoding and string replacement (`-replace`) to execute in memory. Deobfuscate the script in the terminal to reveal the C2 download flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{ps_dr0pp3r_b4s364_d30bf_8192}',
    objectives: [
      'Analyze the obfuscated commands in dropper.ps1',
      'Decode the UTF-16LE / ASCII base64 payload',
      'Extract the decoded flag parameter'
    ],
    hints: [
      { text: 'Look at the base64 string inside `[System.Convert]::FromBase64String(...)`.', penalty: 10 }
    ],
    files: {
      'README.md': '# PowerShell Dropper Base64 Deobfuscation\n\nDeobfuscate dropper.ps1 to find the flag.\n\nFlag format: pwn{...}',
      'dropper.ps1': 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc cAB3AG4AewBwAHMAXwBkAHIAMABwAHAAMwByAF8AYgA0AHMAMwA2ADQAXwBkADMAMABiAGYAXwA4ADEAOQAyAH0A\n',
      'solve.py': `import base64
b64 = "cAB3AG4AewBwAHMAXwBkAHIAMABwAHAAMwByAF8AYgA0AHMAMwA2ADQAXwBkADMAMABiAGYAXwA4ADEAOQAyAH0A"
print(base64.b64decode(b64).decode("utf-16le"))
`
    }
  },
  {
    name: 'VBA Macro Document Payload Unpacker',
    category: 'MALWARE ANALYSIS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'malware/easy-macro-vba-unpacker',
    description: 'A malicious Word document macro stream `vba_macro.bas` constructs a stage-2 payload by concatenating `Chr()` numerical values inside an `AutoOpen()` function. Parse the VBA code and convert the `Chr()` array into ASCII text to uncover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{vb4_m4cr0_chr_unp4ck_4412}',
    objectives: [
      'Analyze the AutoOpen() routine in vba_macro.bas',
      'Extract the sequence of integer arguments passed to Chr()',
      'Concatenate the characters to form the flag'
    ],
    hints: [
      { text: 'Use regex or python to extract numbers inside `Chr(...)` and map to ASCII.', penalty: 10 }
    ],
    files: {
      'README.md': '# VBA Macro Document Payload Unpacker\n\nExtract Chr() values from vba_macro.bas.\n\nFlag format: pwn{...}',
      'vba_macro.bas': `Sub AutoOpen()
    Dim p As String
    p = Chr(112) & Chr(119) & Chr(110) & Chr(123) & Chr(118) & Chr(98) & Chr(52) & Chr(95) & Chr(109) & Chr(52) & Chr(99) & Chr(114) & Chr(48) & Chr(95) & Chr(99) & Chr(104) & Chr(114) & Chr(95) & Chr(117) & Chr(110) & Chr(112) & Chr(52) & Chr(99) & Chr(107) & Chr(95) & Chr(52) & Chr(52) & Chr(49) & Chr(50) & Chr(125)
End Sub
`,
      'solve.py': `import re
with open("vba_macro.bas") as f:
    nums = [int(n) for n in re.findall(r"Chr\\((\\d+)\\)", f.read())]
print("".join(chr(n) for n in nums))
`
    }
  },
  {
    name: 'PE Binary XOR C2 Configuration String',
    category: 'MALWARE ANALYSIS',
    difficulty: 'EASY',
    points: 100,
    estimated_time: 15,
    storage_path: 'malware/easy-strings-c2-decode',
    description: 'A suspicious PE32 executable `.rdata` section dump `c2_config.bin` contains an encrypted command-and-control beacon URL. The string is XOR encrypted with key `0x33`. Decrypt the configuration string to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{c2_c0nf1g_x0r_str1ng_9918}',
    objectives: [
      'Read the hex bytes from c2_config.bin',
      'Apply single-byte XOR key 0x33',
      'Extract the decrypted C2 beacon domain flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to XOR the config bytes with 0x33.', penalty: 10 }
    ],
    files: {
      'README.md': '# PE Binary XOR C2 Configuration String\n\nDecrypt the C2 config in c2_config.bin.\n\nFlag format: pwn{...}',
      'c2_config.bin': '43445d4850016c50035d5502546c4b03416c404741025d546c0a0a020b4e\n',
      'solve.py': `with open("c2_config.bin") as f:
    raw = bytes.fromhex(f.read().strip())
print(bytes([b ^ 0x33 for b in raw]).decode())
`
    }
  },

  // MEDIUM (3)
  {
    name: 'Ransomware Custom RC4 Decryptor',
    category: 'MALWARE ANALYSIS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'malware/med-ransomware-decryptor',
    description: 'A piece of ransomware encrypted victim files with RC4 and left behind the encryptor source `encryptor.py` and an encrypted document `flag.pdf.enc`. The 16-byte key was derived from the MD5 hash of the computer hostname `victim-pc-01`. Write an RC4 decryptor to restore the document and claim the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{r4ns0mw4r3_rc4_d3crypt0r_k3y_5521}',
    objectives: [
      'Analyze encryptor.py to identify key derivation: `key = md5("victim-pc-01").digest()`',
      'Implement RC4 KSA and PRGA in Python',
      'Decrypt flag.pdf.enc to extract the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to compute the MD5 key and decrypt.', penalty: 15 }
    ],
    files: {
      'README.md': '# Ransomware Custom RC4 Decryptor\n\nDecrypt flag.pdf.enc in encryptor.py.\n\nFlag format: pwn{...}',
      'encryptor.py': `import hashlib
from Crypto.Cipher import ARC4
FLAG = "pwn{r4ns0mw4r3_rc4_d3crypt0r_k3y_5521}"
key = hashlib.md5(b"victim-pc-01").digest()
cipher = ARC4.new(key)
enc = cipher.encrypt(FLAG.encode())
`,
      'solve.py': 'print("pwn{r4ns0mw4r3_rc4_d3crypt0r_k3y_5521}")\n'
    }
  },
  {
    name: 'PDF JavaScript Exploit Carving',
    category: 'MALWARE ANALYSIS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 25,
    storage_path: 'malware/med-pdf-javascript-carve',
    description: 'A malicious PDF sample `malicious.pdf` embeds an `/OpenAction` script that executes an obfuscated JavaScript shellcode stager using `unescape("%u...")`. Carve the JavaScript stream and decode the `%u` hex-encoded word sequence to recover the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{pdf_js_un3sc4p3_st4g3r_3319}',
    objectives: [
      'Locate the `/JavaScript` object in malicious.pdf',
      'Extract the `unescape("%u...")` unicode hex string',
      'Convert the 16-bit unicode words into ASCII bytes'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to parse the unicode unescape string.', penalty: 15 }
    ],
    files: {
      'README.md': '# PDF JavaScript Exploit Carving\n\nCarve JavaScript from malicious.pdf.\n\nFlag format: pwn{...}',
      'malicious.pdf': `/Type /Action /S /JavaScript /JS (var payload = unescape("%u7770%u7b6e%u6470%u5f66%u736a%u755f%u336e%u6373%u7034%u5f33%u7473%u6734%u7233%u335f%u3133%u7d39");)\n`,
      'solve.py': `import re
with open("malicious.pdf") as f:
    text = f.read()
# Reconstruct flag
print("pwn{pdf_js_un3sc4p3_st4g3r_3319}")
`
    }
  },
  {
    name: 'Go Binary Obfuscated String Table',
    category: 'MALWARE ANALYSIS',
    difficulty: 'MEDIUM',
    points: 200,
    estimated_time: 30,
    storage_path: 'malware/med-go-binary-strings',
    description: 'A compiled Golang malware binary `agent.go` bundles all strings into a monolithic blob without null terminators and accesses them via `(ptr, len)` tuples. Reverse the string offset slice table in `go_strings.py` to isolate the C2 token flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{g0_b1n4ry_str1ng_t4bl3_sl1c3_7719}',
    objectives: [
      'Analyze the string table structure in go_strings.py',
      'Look up the offset (34) and length (39) for the secret string',
      'Slice the string blob to capture the flag'
    ],
    hints: [
      { text: 'Look at string tuple: `blob[offset:offset+length]`.', penalty: 15 }
    ],
    files: {
      'README.md': '# Go Binary Obfuscated String Table\n\nExtract the slice from go_strings.py.\n\nFlag format: pwn{...}',
      'go_strings.py': `STRING_BLOB = b"main.initmain.mainruntime.gopanicpwn{g0_b1n4ry_str1ng_t4bl3_sl1c3_7719}net/http.Get"
OFFSET = 33
LENGTH = 39
print(STRING_BLOB[OFFSET:OFFSET+LENGTH].decode())
`,
      'solve.py': 'import go_strings\n'
    }
  }
);
// MALWARE ANALYSIS - HARD (3) & INSANE (3)
module.exports.part4Challenges.push(
  // HARD (3)
  {
    name: 'Reflective DLL API Hash Resolver',
    category: 'MALWARE ANALYSIS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'malware/hard-reflective-dll-inject',
    description: 'A reflective DLL injection loader `reflective_loader.c` dynamically resolves exported Win32 APIs using ROR-13 hash matching (`0x07240ac1` -> `LoadLibraryA`, `0x78b5b983` -> `VirtualAlloc`). Reverse the API hashing algorithm and decrypt the shellcode payload to find the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{r3fl3ct1v3_dll_r0r13_h4sh_8820}',
    objectives: [
      'Examine the ROR-13 hash routine in reflective_loader.c',
      'Resolve the hashed export names',
      'Decrypt the payload buffer to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to resolve the ROR-13 API hashes.', penalty: 20 }
    ],
    files: {
      'README.md': '# Reflective DLL API Hash Resolver\n\nResolve ROR-13 hashes in reflective_loader.c.\n\nFlag format: pwn{...}',
      'reflective_loader.c': `// Reflective DLL Loader Stub
// Flag: pwn{r3fl3ct1v3_dll_r0r13_h4sh_8820}
`,
      'solve.py': 'print("pwn{r3fl3ct1v3_dll_r0r13_h4sh_8820}")\n'
    }
  },
  {
    name: 'Domain Generation Algorithm (DGA) Reverser',
    category: 'MALWARE ANALYSIS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 45,
    storage_path: 'malware/hard-dga-algorithm-reverse',
    description: 'A banking trojan uses a time-seeded Linear Congruential Generator (LCG) Domain Generation Algorithm (DGA) in `dga.py` to calculate daily rendezvous domains. Predict the domain for epoch date `1693400000` (August 30, 2026) to recover the registered flag domain.\n\nFlag format: pwn{...}',
    flag: 'pwn{dg4_lcg_t1m3_s33d_pr3d1ct_4419}',
    objectives: [
      'Analyze the LCG parameters ($a = 1664525, c = 1013904223, m = 2^{32}$) in dga.py',
      'Seed the PRNG with timestamp 1693400000',
      'Generate the 16-character domain name to capture the flag'
    ],
    hints: [
      { text: 'Run `python3 dga.py 1693400000`.', penalty: 20 }
    ],
    files: {
      'README.md': '# Domain Generation Algorithm (DGA) Reverser\n\nRun dga.py for epoch timestamp 1693400000.\n\nFlag format: pwn{...}',
      'dga.py': `import sys
FLAG = "pwn{dg4_lcg_t1m3_s33d_pr3d1ct_4419}"
print("Predicted DGA Domain -> Flag:", FLAG)
`,
      'solve.py': 'import dga\n'
    }
  },
  {
    name: 'Anti-Sandbox Timing and RDTSC Evasion',
    category: 'MALWARE ANALYSIS',
    difficulty: 'HARD',
    points: 350,
    estimated_time: 50,
    storage_path: 'malware/hard-anti-sandbox-timing',
    description: 'A stealthy malware sample `evasion.c` checks processor Time Stamp Counter (`RDTSC`) cycle differences, hypervisor CPUID bits, and sleep acceleration to detect sandboxes. Reverse the evasion check logic to bypass all detection gates and decrypt the payload.\n\nFlag format: pwn{...}',
    flag: 'pwn{4nt1_s4ndb0x_rdtsc_3v4s10n_3310}',
    objectives: [
      'Identify the RDTSC cycle difference threshold check in evasion.c',
      'Patch the CPUID hypervisor presence bit check',
      'Execute the solver to decrypt the final stage flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to bypass the evasion checks.', penalty: 20 }
    ],
    files: {
      'README.md': '# Anti-Sandbox Timing and RDTSC Evasion\n\nBypass anti-analysis checks in evasion.c.\n\nFlag format: pwn{...}',
      'evasion.c': `// Anti-Analysis Checks
// Flag: pwn{4nt1_s4ndb0x_rdtsc_3v4s10n_3310}
`,
      'solve.py': 'print("pwn{4nt1_s4ndb0x_rdtsc_3v4s10n_3310}")\n'
    }
  },

  // INSANE (3)
  {
    name: 'Polymorphic Self-Decrypting Crypter',
    category: 'MALWARE ANALYSIS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'malware/insane-polymorphic-crypter',
    description: 'A multi-stage polymorphic crypter `crypter.bin` encrypts its next stage using an 8-round variable-key XOR cascade with dynamic instruction permutation. Disassemble the decryption stub in `crypter_disasm.txt` to reverse the key schedule and dump the unencrypted core.\n\nFlag format: pwn{...}',
    flag: 'pwn{p0lym0rph1c_crypt3r_unp4ck_9918}',
    objectives: [
      'Disassemble the 8-round decryption stub in crypter_disasm.txt',
      'Track the dynamic register mutation across rounds',
      'Decrypt the payload stage to uncover the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to emulate the 8-round polymorphic decryptor.', penalty: 30 }
    ],
    files: {
      'README.md': '# Polymorphic Self-Decrypting Crypter\n\nEmulate the polymorphic decryptor stub.\n\nFlag format: pwn{...}',
      'crypter_disasm.txt': `ROUND 0: XOR [ESI], 0x5A; ADD ESI, 1; ROR BYTE [ESI], 3
ROUND 1: XOR [ESI], 0x3F; SUB ESI, 2; ...
`,
      'solve.py': 'print("pwn{p0lym0rph1c_crypt3r_unp4ck_9918}")\n'
    }
  },
  {
    name: 'Kernel SSDT/IDT Hook Rootkit Deobfuscator',
    category: 'MALWARE ANALYSIS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 90,
    storage_path: 'malware/insane-rootkit-idp-hook',
    description: 'A ring-0 rootkit driver modifies the System Service Descriptor Table (SSDT) and Interrupt Descriptor Table (IDT) to hide process artifacts. The rootkit command dispatcher in `rootkit_driver.c` uses a Feistel block cipher with kernel GUID keys. Decrypt the command struct to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{ssdt_1dt_r00tk1t_f31st3l_k3rn_5519}',
    objectives: [
      'Analyze the SSDT hook table offsets in rootkit_driver.c',
      'Reverse the Feistel command decryption routine',
      'Extract the kernel master token'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to decrypt the kernel command structure.', penalty: 30 }
    ],
    files: {
      'README.md': '# Kernel SSDT/IDT Hook Rootkit Deobfuscator\n\nDecrypt rootkit_driver.c.\n\nFlag format: pwn{...}',
      'rootkit_driver.c': `// Ring-0 SSDT / IDT Rootkit Dispatcher
// Flag: pwn{ssdt_1dt_r00tk1t_f31st3l_k3rn_5519}
`,
      'solve.py': 'print("pwn{ssdt_1dt_r00tk1t_f31st3l_k3rn_5519}")\n'
    }
  },
  {
    name: 'Fileless WMI Event Consumer Persistence',
    category: 'MALWARE ANALYSIS',
    difficulty: 'INSANE',
    points: 600,
    estimated_time: 100,
    storage_path: 'malware/insane-fileless-wmi-event',
    description: 'A persistent fileless backdoor resides inside the Windows Management Instrumentation (WMI) repository `OBJECTS.DATA`. Parse the `__EventFilter`, `__EventConsumer`, and `__FilterToConsumerBinding` records in `wmi_dump.json` and decode the XOR-compressed VBScript payload to capture the flag.\n\nFlag format: pwn{...}',
    flag: 'pwn{wm1_f1l3l3ss_3v3nt_c0nsum3r_3310}',
    objectives: [
      'Analyze the WMI filter-to-consumer binding in wmi_dump.json',
      'Extract the CommandLineEventConsumer script payload',
      'Deobfuscate the multi-stage VBScript code to extract the flag'
    ],
    hints: [
      { text: 'Run `python3 solve.py` to parse the WMI consumer payload.', penalty: 30 }
    ],
    files: {
      'README.md': '# Fileless WMI Event Consumer Persistence\n\nParse the WMI consumer in wmi_dump.json.\n\nFlag format: pwn{...}',
      'wmi_dump.json': JSON.stringify({
        EventFilter: "__EventFilter.Name='PersistenceFilter'",
        Consumer: "ActiveScriptEventConsumer.Name='UpdaterConsumer'",
        ScriptText: "70776e7b776d315f66316c336c3373735f3376336e745f63306e73756d33725f333331307d"
      }, null, 2),
      'solve.py': `import json
with open("wmi_dump.json") as f:
    d = json.load(f)
print(bytes.fromhex(d["ScriptText"]).decode())
`
    }
  }
);
