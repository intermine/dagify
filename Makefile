default: all

SRC = $(shell find src -name "*.ls" -type f | sort)
LIB = $(SRC:src/%.ls=lib/%.js)
LSC = node_modules/.bin/lsc
BROWSERIFY = node_modules/.bin/browserify
MOCHA = node_modules/.bin/mocha

build/org-chart.js: $(LIB) $(BROWSERIFY) build
	$(BROWSERIFY) \
		--debug \
		--extension ls \
		--transform liveify \
		--entry ./src/org-chart.ls \
		> build/org-chart.js

build/ontology-widget.js: $(LIB) $(BROWSERIFY) build
	$(BROWSERIFY) \
		--debug \
		--extension ls \
		--standalone OntologyWidget \
		--transform liveify \
		--require ./src/ontology-widget.ls \
		> build/ontology-widget.js

build/ontology-demo.js: $(BROWSERIFY) $(LIB) build
	$(BROWSERIFY) \
		--debug \
		--extension ls\
		--noparse node_modules/imjs/js/im.js \
		--transform liveify \
		--entry ./src/ontology-demo.ls \
		--outfile build/ontology-demo.js

$(BROWSERIFY): package.json
	npm install .

build:
	mkdir -p build/

lib:
	mkdir lib/

lib/%.js: src/%.ls $(LSC)
	@date
	@mkdir -p `dirname "$@"`
	$(LSC) --compile --print "$<" > "$@"

browser:
	mkdir -p browser

dist:
	mkdir -p dist

package.json: package.ls $(LSC)
	$(LSC) --compile --json package.ls

$(LSC):
	npm install LiveScript

all: build/org-chart.js build/ontology-demo.js

.PHONY: all build-browser dev-install loc clean report-widget

dev-install: package.json
	npm install .

repl: $(LSC)
	$(LSC) -d

loc:
	wc --lines src/*

clean:
	rm --force package.json
	rm --force --recursive lib
	rm --force --recursive dist
	rm --force --recursive jstl
	rm --force --recursive build
	rm --force *.js
