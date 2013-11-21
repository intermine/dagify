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
	@date
	@mkdir -p `dirname "$@"`
	$(LSC) --compile --print "$<" > "$@"

jstl/%: views/%.eco
	$(ECO) --print "$<" > "$@"

browser:
	mkdir browser

dist:
	mkdir dist

dagify.js: $(LIB)
	$(BROWSERIFY) -r ./lib/dagify.js:dagify > dagify.js

org-chart.js: dev-install 
	$(BROWSERIFY) \
		--debug \
		--extension=ls \
		--transform liveify \
		--entry ./src/org-chart.ls \
		> org-chart.js

ontology-dag.js: $(LIB)
	$(BROWSERIFY) \
		--debug \
		--extension=ls \
		--transform liveify \
		--entry ./src/ontology-dag.ls \
		> ontology-dag.js

demo.js: $(LIB)
	$(BROWSERIFY) -e ./lib/demo.js > demo.js

ontology-widget.js: $(LIB)
	$(BROWSERIFY) -r ./lib/presenter.js:ontology-widget > ontology-widget.js

package.json: package.ls
	$(LSC) --compile --json package.ls

templates.js: jstl $(TEMPL)
	cat jstl/* > templates.js

report-widget: lib ontology-widget.js dist
	cp ontology-widget.js dist/presenter.js
	cp views/*.eco dist/
	cp style.css dist/

all: clean org-chart.js ontology-dag.js

.PHONY: all build-browser dev-install loc clean report-widget

dev-install: package.json
	npm install .

repl: dev-install
	./node_modules/LiveScript/bin/lsc -d

loc:
	wc --lines src/*

clean:
	rm --force package.json
	rm --force --recursive lib
	rm --force --recursive dist
	rm --force --recursive jstl
	rm --force *.js

build-browser: dagify.js
