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
        "main": "",
        "jump": "",
        "code": ""
    }

    # Figure out better parsing solution later?
    f = open(fh + "/model/" + name + ".h", "r")
    matches = data["code"] = re.search(r"#define MODEL_CODE \"([0-9]+)\"", f.read())
    if matches == None:
        data["code"] = ""
    else:
        data["code"] = matches.group(1)

    models.append(data)

files = {
    
}

f = open(fh + "/main.S")
files["main.S"] = f.read()
f.close()
f = open(fh + "/jump.S")
files["jump.S"] = f.read()
f.close()

info = {
    "files": files,
    "models": models
}

f = open("data.js", "w")
f.write("var fujihack_data = " + json.dumps(info, indent=4, sort_keys=True) + ";")
f.close()
