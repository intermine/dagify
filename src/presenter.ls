
DEFAULT_GRAPH_STATE =
      view: 'Dag'
      smallGraphThreshold: 20
      jiggle: null
      spline: 'curved'
      dagDirection: 'LR'
      maxmarked: 20
      tickK: 15
      translate: [5, 5]
      elision: null

$ = jQuery

# Requires a libray called 'dagify' with the following functions:
# - progressMonitor (elem) -> ([Promise]) -> () # Monitors progress from the promises in the elem
# - graphify monitor -> (Query -> Promise[Rows]) -> Query -> Promise[Graph]
# - fetchAndMergeHomology monitor -> Service -> Service -> Graph -> Query -> ()
# - annotateForCounts (obj -> Query) -> [Node] -> ()
# - doHeightAnnotation [Node] -> ()
# - edgesToNodes [Edge] -> [Node]
# - renderDag / renderForce :: elem -> Model -> Graph -> ()
# The model passed to any render function expects the following events:
# - 'nodes:marked', [Node] -- The list of marked nodes
# - 'edges:marked', [Edge] -- The list of marked edges
#
dagify = require './dagify'
{map, id, each, first, zip-all} = require \prelude-ls
{objectify} = require './util'
GraphState = require './state'

getGraphState = ( config ) ->

    initVals =
        root: null
        animating: 'waiting'

    data = {} <<< DEFAULT_GRAPH_STATE <<< initVals <<< config.graphState
    throw new Error "No query provided." unless data.query?
    new GraphState data

class OntologyWidget extends Backbone.View

    initialize: (@config, @templates) ->
      Service = intermine.Service
      @service = new Service @config.service
      @model = getGraphState @config
      @interop-mines = @config.interop |> objectify (.taxon-id), ({name}:grp) -> (<<< {name}) new Service grp

    to-string: -> """[OntologyWidget(#{ @cid })]"""

    render: (target) ->

      elem = $(target)[0]
      @set-element elem
      unless @model.has \dimensions
        @model.set dimensions:
            w: elem.offsetWidth
            h: (elem.offsetHeight or 600)

      @renderChrome()
      @startListening()
      @loadData()

      return this

    @BINDINGS =
      tickK: '.min-ticks'
      jiggle: '.jiggle'
      spline: '.spline'
      view: '.graph-view'
      dag-direction: '.dag-direction'

    startListening: ->
      for key, sel of @@BINDINGS then do (sel) ~>
          @listenTo @model, 'change:' + key, (m, v) ~> @$(sel).val v

      @listenTo @model, 'change:query', @loadData
      @listenTo @model, 'change:query', @~resetHomologyButtons
      @listenTo @model, 'change:heights', @fillElisionSelector
      @listenTo @model, 'change:root', @onRootChange
      @listenTo @model, 'change:elision', (m, elision) ~> @$('.elision').val elision
      @listenTo @model, 'change:all', @~renderRoots
      @listenTo @model, 'change:all', (m, graph) -> m.set root: first graph.get-roots!
      @listenTo @model, 'change:graph change:view change:dagDirection', @~presentGraph
      @listenTo @model, 'nodes:marked change:all', @~showOntologyTable
      @on 'controls:changed', ~> @$el.foundation()
      @on 'graph:reset', ~>
        @model.get('all').unmark()
        @model.trigger 'nodes:marked'

    onRootChange: ~>
      root = @model.get 'root'
      console.log "Root is now #{ root?.id }: #{ root?.label }"
      @$('.graph-root').val root.id if root?

    renderRoots: ->
      roots = @model.get('all').get-roots!
      select = @$('select.graph-root').empty()
      for r in roots.concat({id: null, label: 'All'})
        select.append """<option value="#{ r.id }">#{ r.label }</option>"""
      @trigger 'controls:changed'

    presentGraph: ->
      console.log "Presenting graph to the world"
      view = @model.get 'view'
      render = dagify['render' + view] or dagify.renderDag
      process.next-tick ~> render @model, @model.get 'graph'

    resetHomologyButtons: ->
        @$ '.interop-sources a' .remove-class 'disabled'

    fillElisionSelector: ~>
      elisionSelector = @$ 'select.elision'
      elisionSelector.empty()

      for h in @model.get 'heights'
        text = if h is 0
          "Show all terms"
        else if h is 1
          "Show only direct terms, and the root term"
        else
          "Show all terms within #{ h } steps of a directly annotated term"

        elisionSelector.append """<option value="#{ h }">#{ text }</option>"""

      @trigger 'controls:changed'
      if level = @model.get 'elision'
        elisionSelector.val level

    renderChrome: ->
      @$el.html @templates['widget.html']!
      for key, sel of Widget.BINDINGS
        @$(sel).val @model.get key
      @model.set \svg, first @$el.find(\svg)
      @setUpOntologyTable!
      @setup-interop!

    setUpOntologyTable: ->
      {w, h} = @model.get 'dimensions'
      table = @$('.ontology-table').addClass(\open).css {
        top: (0.05 * h)
        left: (w - 50)
        height: (0.9 * h)
        width: (0.6 * w)
      }
      table.find \.scroll-container .css 'max-height': 0.8 * h
      table.find('table').addClass('tablesorter').tablesorter()

    setup-interop: ->
      $ul = @$ '.interop-sources'
      self = @
      toOption = (group) ->
        $li = $ """<li><a class="small button">#{ group.name }</a></li>"""
        $li.find('a').on 'click', ->
          $this = $ @
          return if $this.hasClass 'disabled'
          $this.addClass 'disabled'
          self.addDataFrom group.taxonId

      each $ul~append . toOption, @config.interop

    addDataFrom: (taxonId) ->

      service = @interopMines[taxonId]
      graph = @model.get \all
      query = @model.get \query
      monitor = dagify.progressMonitor @$ '.homologue-progress'
      merging = dagify.fetchAndMergeHomology monitor, @service, service, graph, query, taxonId

      merging.fail @reportError
      merging.done (merged) ~> @annotate merged
      merging.done (merged) ~> @model.set all: merged
      merging.done (merged) ~> @model.set roots: merged.getRoots()

    link-row: (link) ->
      evt = \relationship:highlight
      $row = $ @templates['ontologyRelationshipRow.html'] link
      $row.on('mouseout',  ~> $row.removeClass('highlit'); @model.trigger evt, null)
          .on('mouseover', ~> $row.addClass('highlit'); @model.trigger evt, link)

    term-row: (term) ->
      evt = 'term:highlight'
      $row = $ @templates['ontologyTermRow.html'] term
      $row.on('mouseout',  ~> $row.removeClass('highlit'); @model.trigger evt, null)
          .on('mouseover', ~> $row.addClass('highlit'); @model.trigger evt, term)

    showOntologyTable: ->
        {w, h} = @model.get 'dimensions'
        marked-statements = @model.get('all').getMarkedStatements()
        console.log "Got #{ marked-statements.length } marked statements"

        $tables   = map @~$, <[.marked-statements .marked-terms]>
        templates = [ @~link-row, @~term-row ]
        filters   = [ id, dagify.edgesToNodes ]

        each (-> it.find(\tbody).empty!), $tables

        ontology-table = @$ \.ontology-table
        if marked-statements.length

            for [$el, tmpl, f] in zip-all $tables, templates, filters
                each $el~append . tmpl, f marked-statements

            ontology-table
                .show!
                .foundation 'section', 'reflow'
                .find('table').trigger 'update'

            @toggleOntologyTable!
        else
            ontology-table.animate left: (w - 50), ->
                ontology-table.removeClass \open .hide!

    events: ->
      state = @model
      evts =
          'submit .graph-control': (e) -> e.preventDefault()
          'click .graph-control .resizer': 'toggleDisplayOptions'
          'click .graph-reset': ~> @trigger 'graph:reset'
          'click .marked-terms .description .more': ->
              $(it.target).hide!prev!hide!end!next!show!

      for key, sel of Widget.BINDINGS
          evts['change ' + sel] = (-> $(it.target).val!) >> state.set key, _

      evts['click .button.symbol'] = ->
        newSymbol = @$('input.symbol').val()
        state.set query: newSymbol

      evts['change .graph-root'] = (e) ->
        rootId = $(e.target).val()
        state.set root: state.get('all').getNode rootId

      evts['change .elision'] = -> state.set 'elision', parseInt($(it.target).val(), 10)

      evts['click .slide-control'] = @~toggleOntologyTable

      return evts

    toggleOntologyTable: (event) ->
        getLeft = (isOpen) ~>
            w = $(\body).outer-width!
            w - 50 - (if isOpen then 0 else @$('.ontology-table .section-container').outerWidth())
        table = @$('.ontology-table')
        wasOpen = not event or table.hasClass 'open'
        table.toggleClass('open').animate( left: getLeft(wasOpen) )
        icon = $('.slide-control i')
          .removeClass('icon-chevron-right icon-chevron-left')
          .addClass(if wasOpen then 'icon-chevron-left' else 'icon-chevron-right')

    toggleDisplayOptions: ->
      @$ '.graph-control .resizer'
        .toggleClass 'icon-resize-small icon-resize-full'
      @$ '.graph-control .hidable'
        .slideToggle()

    loadData: ~>
      monitor = dagify.progressMonitor @$ '.dag .progress'
      building = dagify.graphify monitor, @service.rows, @model.get 'query'
      building.fail @reportError
      building.done (graph) ~> @annotate graph
      building.done (graph) ~> @model.set all: graph
      building.done (graph) ~> @model.set roots: graph.getRoots()

    annotate: (graph) ->
      dagify.annotateForCounts @service.query, graph.nodes
      dagify.doHeightAnnotation(graph.nodes).done ~>
        @model.set heights: graph.getHeights()
        @model.trigger 'annotated:height'

    reportError: (e) -> alert "Error: #{ e }"

Widget = OntologyWidget # Alias for report-widgets
module.exports = OntologyWidget

