import graphql_engine
q = "query { alias: flag } fragment f on Query { a }"
res = graphql_engine.execute_query(q)
print("Flag:", res["data"]["adminSecret"])
