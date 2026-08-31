FLAG = "pwn{gr4phql_4l14s_fr4gm3nt_byp4ss_8820}"
def execute_query(q):
    if "fragment" in q and "alias" in q:
        return {"data": {"adminSecret": FLAG}}
    return {"errors": ["Query too complex"]}
