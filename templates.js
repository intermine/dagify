(function() {
  this.ecoTemplates || (this.ecoTemplates = {});
  this.ecoTemplates["ontologyRelationshipRow.html"] = function(__obj) {
    if (!__obj) __obj = {};
    var __out = [], __capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return __safe(result);
    }, __sanitize = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else if (typeof value !== 'undefined' && value != null) {
        return __escape(value);
      } else {
        return '';
      }
    }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
    __safe = __obj.safe = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else {
        if (!(typeof value !== 'undefined' && value != null)) value = '';
        var result = new String(value);
        result.ecoSafe = true;
        return result;
      }
    };
    if (!__escape) {
      __escape = __obj.escape = function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
    }
    (function() {
      (function() {
        __out.push('<tr>\n    <td>');
      
        __out.push(__sanitize(this.source.id));
      
        __out.push(': ');
      
        __out.push(__sanitize(this.source.label));
      
        __out.push('</td>\n    <td>');
      
        __out.push(__sanitize(this.label));
      
        __out.push('</td>\n    <td>');
      
        __out.push(__sanitize(this.target.id));
      
        __out.push(': ');
      
        __out.push(__sanitize(this.target.label));
      
        __out.push('</td>\n</tr>\n\n');
      
      }).call(this);
      
    }).call(__obj);
    __obj.safe = __objSafe, __obj.escape = __escape;
    return __out.join('');
  };
}).call(this);
(function() {
  this.ecoTemplates || (this.ecoTemplates = {});
  this.ecoTemplates["ontologyTermRow.html"] = function(__obj) {
    if (!__obj) __obj = {};
    var __out = [], __capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return __safe(result);
    }, __sanitize = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else if (typeof value !== 'undefined' && value != null) {
        return __escape(value);
      } else {
        return '';
      }
    }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
    __safe = __obj.safe = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else {
        if (!(typeof value !== 'undefined' && value != null)) value = '';
        var result = new String(value);
        result.ecoSafe = true;
        return result;
      }
    };
    if (!__escape) {
      __escape = __obj.escape = function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
    }
    (function() {
      (function() {
        __out.push('<tr>\n    <td>');
      
        __out.push(__sanitize(this.id));
      
        __out.push('</td>\n    <td>');
      
        __out.push(__sanitize(this.label));
      
        __out.push('</td>\n    <td class="description">\n        <span class="brief-description">');
      
        __out.push(__sanitize(this.description.substring(0, 50)));
      
        __out.push('</span>\n        ');
      
        if (this.description.length > 50) {
          __out.push('\n            <a class="button small more">more</a>\n            <span class="full-description">\n                ');
          __out.push(__sanitize(this.description));
          __out.push('\n            </span>\n        ');
        }
      
        __out.push('\n    </td>\n    <td>');
      
        __out.push(__sanitize(this.getTotalCount()));
      
        __out.push('</td>\n    <td>');
      
        __out.push(__sanitize(this.sources.join(', ')));
      
        __out.push('</td>\n    <td>');
      
        __out.push(__sanitize(this.symbols.join(', ')));
      
        __out.push('</td>\n</tr>\n\n');
      
      }).call(this);
      
    }).call(__obj);
    __obj.safe = __objSafe, __obj.escape = __escape;
    return __out.join('');
  };
}).call(this);
(function() {
  this.ecoTemplates || (this.ecoTemplates = {});
  this.ecoTemplates["widget.html"] = function(__obj) {
    if (!__obj) __obj = {};
    var __out = [], __capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return __safe(result);
    }, __sanitize = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else if (typeof value !== 'undefined' && value != null) {
        return __escape(value);
      } else {
        return '';
      }
    }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
    __safe = __obj.safe = function(value) {
      if (value && value.ecoSafe) {
        return value;
      } else {
        if (!(typeof value !== 'undefined' && value != null)) value = '';
        var result = new String(value);
        result.ecoSafe = true;
        return result;
      }
    };
    if (!__escape) {
      __escape = __obj.escape = function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
    }
    (function() {
      (function() {
        __out.push('<div class="ontology-widget">\n    <div class="dag">\n        <div class="progress"><span class="meter"></span></div>\n        <svg width="100%" height="100%">\n            <defs>\n                <marker class="arrowhead"\n                        viewBox="0 0 12 12"\n                        refX="1"\n                        refY="5"\n                        markerUnits="userSpaceInUse"\n                        markerWidth="8"\n                        markerHeight="5"\n                        orient="auto"\n                        style="fill: #555">\n                    <circle cx="5" cy="5", r="5"/>\n                </marker>\n                <marker class="Triangle"\n                    viewBox="0 0 10 10" refX="0" refY="5" \n                    markerUnits="strokeWidth"\n                    markerWidth="4" markerHeight="3"\n                    orient="auto">\n                    <path d="M 0 0 L 10 5 L 0 10 z" />\n                </marker>\n                <marker class="TriangleDown"\n                    viewBox="0 0 10 10" refX="0" refY="5" \n                    markerUnits="strokeWidth"\n                    markerWidth="4" markerHeight="3"\n                    orient="270">\n                    <path d="M 0 0 L 10 5 L 0 10 z" />\n                </marker>\n                <path class="throbber" d="M 150,0\n                        a 150,150 0 0,1 106.066,256.066\n                        l -35.355,-35.355\n                        a -100,-100 0 0,0 -70.711,-170.711 z"\n                        fill="#3d7fe6">\n                    <animateTransform attributeName="transform" attributeType="XML"\n                        type="rotate" from="0 150 150" to="360 150 150"\n                        begin="0s" dur="1s" fill="freeze" repeatCount="indefinite" />\n                </path>\n            </defs>\n        </svg>\n    </div>\n    <form class="graph-control">\n        <i class="resizer icon-resize-full"></i>\n        <div class="row">\n            <h6>Display Options</h6>\n        </div>\n        <div class="hidable">\n            <select class="graph-view">\n                <option value="Dag" selected>Directed Acyclic Graph</option>\n                <option value="Force">Force Directed Graph</option>\n            </select>\n            <select class="dag-direction">\n                <option value="LR" selected>Left-to-Right</option>\n                <option value="TB">Top-to-Bottom</option>\n            </select>\n            <!-- <input type="number" class="min-ticks"> -->\n            <div class="row collapse">\n                <div class="small-8 columns">\n                    <input class="symbol" type="text" placeholder="bsk">\n                </div>\n                <div class="small-4 columns">\n                    <a class="button prefix symbol">Search</a>\n                </div>\n            </div>\n            <fieldset>\n                <div>\n                    Add annotations from homologues in:\n                    <ul class="button-group interop-sources">\n                    </ul>\n                </div>\n                <div class="progress homologue-progress">\n                    <span class="meter"></span>\n                </div>\n            </fieldset>\n            <fieldset>\n                <select class="jiggle">\n                    <option value="none">Force Directed Layout</option>\n                    <option value="strata">Move Roots to Top</option>\n                    <option value="centre">Move Roots to Centre</option>\n                </select>\n                <select class="elision" >\n                </select>\n            </fieldset>\n            <select class="graph-root" >\n            </select>\n            <button class="graph-reset" >Reset</button>\n        </div>\n    </form>\n    <div class="ontology-table">\n        <div class="slide-control">\n            <i class="icon-chevron-left"></i>\n        </div>\n        <div class="ontology-table-container">\n            <div data-section class="section-container tabs ontology-table-container">\n                <section>\n                    <p class="title" data-section-title><a href="#panel1">Statements</a></p>\n                    <div class="content" data-section-content>\n                      <div class="scroll-container">\n                        <table class="marked-statements">\n                            <thead>\n                                <tr>\n                                    <th>Subject</th>\n                                    <th>Predicate</th>\n                                    <th>Object</th>\n                                </tr>\n                            </thead>\n                            <tbody></tbody>\n                        </table>\n                      </div>\n                    </div>\n                </section>\n                <section>\n                    <p class="title" data-section-title><a href="#panel2">Terms</a></p>\n                    <div class="content" data-section-content>\n                      <div class="scroll-container">\n                        <table class="marked-terms">\n                            <thead>\n                                <tr>\n                                    <th>Identifier</th>\n                                    <th>Name</th>\n                                    <th>Description</th>\n                                    <th>Gene Count</th>\n                                    <th>Present in</th>\n                                    <th>Annotated to</th>\n                                </tr>\n                            </thead>\n                            <tbody></tbody>\n                        </table>\n                      </div>\n                    </div>\n                </section>\n            </div>\n        </div>\n    </div>\n</div>\n\n');
      
      }).call(this);
      
    }).call(__obj);
    __obj.safe = __objSafe, __obj.escape = __escape;
    return __out.join('');
  };
}).call(this);
