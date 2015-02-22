# Dagify

A tool for displaying hierarchical graph data.

## Installation

Install with NPM:

```
npm install --save-dev dagify
```

## Usage

Build components by specifying the data and the appropriate callbacks in calls
to the constructor, or by subclassing:

```js
var myGraph = new Widget({
  edges: [...],
  nodes: [...],
  el: '#my-element'
});

myGraph.render();

// Alternatively:

function MyWidget(opts) {
    Widget.call(this, opts);
}

MyWidget.prototype = Object.create(Widget.prototype, {
    getNodeID: node => node.name,
    getNodeLabel: node => node.description
});
MyWidget.prototype.constructor = MyWidget;

```

Look at the `words` and `species` demo files in `src/demo` for examples.

An important part of the design is that rather than constraining the
shape of the data, callbacks can be supplied to customise how the data is
read in.

## Widget API

### Constructor: `DagWidget(graph, methods)`

Create a new DagWidget. The following graph options are supported:

* `nodes`: An array of nodes in the graph. Each node should be present at most
  once and should be uniquely identifiable (using the `node.id` property
  by default), but this can be configured with the callback methods - see
  below.
* `edges`: An array of edges in the graph. Each edge should be present at most
  once and should be uniquely identifiable. Each edge should have a `source` and
  `target` that refers to a corresponding `node.id` - but this can be configured
  by using the callback methods.
* `el`: The element (or a selector string) indicating the DOM element to render
  this widget to. This is optional - see also `setElement`.
* `summaryEl`: The elements (or a selector string) indicating the DOM elemen to
  render the graph summary to. Use of the graph summary is completely optional.
  See also `setSummaryElement`.
* `opts`: The (optional) configuration options for the graph, supporting the
  following options:

  * `rankdir`: One of `tb`, `bt`, `lr`, `rl`: Determining the direction the
    graph is rendered in. If each edge represents a predicate of the form 
    `(A PRED B)`, then the `rankdir` property will cause the elements of that
    predicate to be rendered in that order. For example, if the predicate is `A
    LIKES B`, and the `rankdir` is `lr` (left-to-right), then A will be on the
    left, and B will be on the right, with the predicate reading like the
    English sentence.

### `setElement(elOrSelector)`

Set the DOM element this widget renders to, if not supplied by to the
constructor. Rendering will have no effect until an element is set.

### `setSummaryElement(elOrSelector)`

Set the DOM element this widget will render its summary to. Making use of the
graph summary (indicating the number of nodes and edges and allowing root nodes
to be chosen), is completely optional. The graph summary will not be rendered
until an element is supplied for it.

### `eachNode(callback)`

Iterate through each of the nodes in the currently displayed graph, passing
each one to the callback. e.g.:

```js
widget.eachNode(node => console.log(node.id))
```

### `eachEdge(callback)`

Iterate through each edge is the currently visible graph, passing each one to
the callback. E.g: 

```js
widget.eachEdge(edge => console.log(edge.id))
```

### `render()`

Render the graph and its summary to their corresponding DOM nodes.

## Events

The widget contains three different data models you can listen to for events:

* `#graphState` Contains the options such as the rank direction.
* `#edges` A collection containing the edges.
* `#nodes` A collection containing the nodes.

One can listen to these as follows:

```js
w.graphState.on('change:rankdir', () => console.log('Direction changed'));
w.graphState.on('change:currentRoot', () => console.log('Root changed'));
w.nodes.on('add', () => console.log('Node added'));
w.edges.on('add', () => console.log('Edge added'));
```

In addition the widget itself is an event emitter and emits the following
events:

* `change:graph` - Emitted when the graph changes.

## Graph Data

The minimal assumption about the graph data is that it is two arrays, one of
nodes and the other of edges. They do not have to reference each other directly,
and there are default behaviours so that data can be provided without specifying
handlers. The default data structure is assumed to be a list of `Object`, where:

* Nodes: have `{label, id}`

* Edges: have `{source, target, label}`, where source and target are values that
  are equal (via `===`) to at least one of the ids in the nodes list.

If your data looks different to this, then you can supply handler methods to the
widget constructor. For example if your graph is a semantic set of propositions
where the nodes are `{url, description}` and the edges are
`{subject, predicate, object}`, then you could define a set of handlers such as:

```js
var PropositionHandlers = {
    getNodeID: node => node.url
    getNodeLabel: node => node.description
    getEdgeSource: edge => edge.subject
    getEdgeTarget: edge => edge.object
    getEdgeLabel: edge => edge.predicate
};
```

And then construct a widget with them as follows:

```js
var widget = new DagWidget(graph, PropositionHandlers);
```

## Developing

Run the dev server (with live-reload and automatic code-rebuilding):

```sh
npm start
```
