JSFILES=$(shell find -type f -iname '*.js' -path './' -o -iname '*.js' -path './lib/*')

lint: $(JSFILES)
	jslint --node --sloppy --plusplus $+


