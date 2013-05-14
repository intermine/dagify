default: all

SRC = $(shell find src -name "*.ls" -type f | sort)
LIB = $(SRC:src/%.ls=lib/%.js)
VIEWS = $(shell find views -name "*.eco" -type f | sort)
TEMPL = $(VIEWS:views/%.eco=jstl/%)
LS = node_modules/LiveScript
LSC = node_modules/.bin/lsc
ECO = node_modules/.bin/eco
BROWSERIFY = node_modules/.bin/browserify
UGLIFYJS = node_modules/.bin/uglifyjs
MOCHA = node_modules/.bin/mocha

lib:
	mkdir lib/

jstl:
	mkdir jstl/

lib/%.js: src/%.ls
	$(LSC) --compile --print "$<" > "$@"

jstl/%: views/%.eco
	$(ECO) --print "$<" > "$@"

browser:
	mkdir browser

dagify.js: $(LIB)
	$(BROWSERIFY) -r ./lib/dagify.js:dagify > dagify.js

demo.js: $(LIB)
	$(BROWSERIFY) -e ./lib/demo.js > demo.js

ontology-widget.js: $(LIB)
	$(BROWSERIFY) -r ./lib/presenter.js:ontology-widget > ontology-widget.js

package.json: package.ls
	$(LSC) --compile --json package.ls

templates.js: jstl $(TEMPL)
	cat jstl/* > templates.js

all: clean lib templates.js dagify.js demo.js ontology-widget.js

.PHONY: all build-browser dev-install loc clean

dev-intall: package.json
	npm install .

loc:
	wc --lines src/*

clean:
	rm --force --recursive lib
	rm *.js

build-browser: dagify.js
