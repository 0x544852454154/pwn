import hashlib
FLAG = "pwn{b0l4_1d0r_uu1d_pr3d1ct4bl3_5521}"
def get_doc(uuid_str):
    target = hashlib.md5(b"doc_42").hexdigest()
    if uuid_str == target:
        return {"status": "success", "content": FLAG}
    return {"status": "error", "message": "Document not found"}
