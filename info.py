# Script is run after stable release

import os, json, re

fh = os.path.abspath("../fujihack")

models = [
    
]

model = os.listdir(fh + "/model")
print("Attempt compile:", model)
for m in model:
    name = m.split(".")[0]
    if name == "template" or name == "stub":
        continue

    data = {
        "name": name,
        "file": "",
    }

    # Figure out better parsing solution later?
    f = open(fh + "/model/" + name + ".h", "r")
    data["data"] = f.read()
    f.close()

    models.append(data)

files = {
    
}

patch = os.listdir(fh + "/patch")
for p in patch:
    f = open(fh + "/patch/" + p, "r")
    files[p] = f.read()
    f.close()

info = {
    "files": files,
    "models": models
}

f = open("data.js", "w")
f.write("var fujihack_data = " + json.dumps(info, indent=4, sort_keys=True) + ";")
f.close()
