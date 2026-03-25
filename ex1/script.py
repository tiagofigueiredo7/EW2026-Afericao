import json

with open("dataset_reparacoes.json", "r") as f:
    data = json.load(f)

reparacoes = data["reparacoes"]

with open("reparacoes.json", "w") as f:
    json.dump(reparacoes, f, indent=2, ensure_ascii=False)
    