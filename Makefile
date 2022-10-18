f?=$(shell echo ~/Downloads/FPUPDATE.DAT)
p?="increment version" "photo props quick"

all:
	python3 info.py
	nodejs cli.js $(f) $(p)
	md5sum $(f) $(f)_

copy: all
	cp $(f)_ /media/$(USER)/*/FPUPDATE.DAT
	umount /media/$(USER)/*/

.PHONY: all copy
