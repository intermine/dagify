# The Service#rows function
{Service} = intermine
{objectify} = require './util'
{map, pairs-to-obj} = require \prelude-ls

interop =
    * taxonId: 4932
      root: \yeastmine-test.yeastgenome.org/yeastmine-dev
      name: \SGD
    * taxonId: 10090
      root: \http://beta.mousemine.org/mousemine
      name: \MGI
    * taxonId: 6239
      root: \http://intermine.modencode.org/release-32
      name: \modMine

interop-later-maybe-when-they-upgrade =
    * taxonId: 7955
      root: \zmine.zfin.org/zebrafishmine
      name: \ZFin
    * taxonId: 10116
      root: \http://ratmine.mcw.edu/ratmine
      name: \RGD

OntologyWidget = require './presenter'

query-params =
    (location.search or '?')
    |> (.substring 1)
    |> (.split \&)
    |> map (map decodeURIComponent) << (.split \=)
    |> pairs-to-obj

current-symbol = -> query-params.symbol or \bsk

main = (symbol) ->
    target = \#dag
    console.log "Rendering a widget for #{ symbol }"
    config =
        interop: interop
        service:
            root: 'http://www.flymine.org/query'
        graph-state:
            query: symbol

    widget = new OntologyWidget config, window.eco-templates
        ..render target

# Let's go! (but only when the page is ready...)
$ -> main current-symbol!

