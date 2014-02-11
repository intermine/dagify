(function(){
  var Backbone, DAG, Controls, OntologyWidget;
  Backbone = require('backbone');
  Backbone.$ = $;
  DAG = require('./dag.ls').DAG;
  Controls = require('./ontology-controls.ls').Controls;
  module.exports = OntologyWidget = (function(superclass){
    var HTML, prototype = extend$((import$(OntologyWidget, superclass).displayName = 'OntologyWidget', OntologyWidget), superclass).prototype, constructor = OntologyWidget;
    function OntologyWidget(options){
      this.dag = new DAG(options);
      this.controls = new Controls(options);
      this.setGraph = bind$(this.dag, 'setGraph');
      this.getGraph = bind$(this.dag, 'getGraph');
      this.dag.on('all', bind$(this, 'trigger'));
    }
    HTML = "<div class=\"large-9 columns ont-w-chart\"></div>\n<div class=\"large-3 columns ont-w-controls\"></div>";
    prototype.className = 'ont-widget row';
    prototype.render = function(){
      var x$, dag, y$, controls;
      this.$el.html(HTML);
      this.$el.css({
        height: '100%',
        width: '100%'
      });
      this.$('.ont-w-chart').css({
        height: '100%'
      });
      x$ = dag = this.dag;
      x$.setElement(this.$('.ont-w-chart'));
      x$.render();
      y$ = controls = this.controls;
      y$.$el.appendTo(this.$('.ont-w-controls'));
      y$.wireToDag(dag);
      y$.render();
      this.$el.foundation();
      return this;
    };
    return OntologyWidget;
  }(Backbone.View));
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
