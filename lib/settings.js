(function(){
  var Backbone, UniqueCollection, ref$, split, join, Settings, out$ = typeof exports != 'undefined' && exports || this;
  Backbone = require('backbone');
  UniqueCollection = require('./unique-collection.ls').UniqueCollection;
  ref$ = require('prelude-ls'), split = ref$.split, join = ref$.join;
  out$.Settings = Settings = (function(superclass){
    var prototype = extend$((import$(Settings, superclass).displayName = 'Settings', Settings), superclass).prototype, constructor = Settings;
    prototype.tagName = 'form';
    prototype.className = 'settings';
    prototype.initialize = function(){
      this.classes = new Backbone.Collection;
      this.classes.on('add', bind$(this, 'insertClass'));
      this.paths = new UniqueCollection([], {
        keyFn: function(it){
          return it.path;
        }
      });
      return this.paths.on('add', bind$(this, 'insertPath'));
    };
    prototype.render = function(){
      var select, addCompany;
      this.$el.empty();
      this.$el.append("<div class=\"row collapse\">\n    <div class=\"small-9 columns\">\n        <input class=\"find\" type=\"text\" placeholder=\"filter\">\n    </div>\n    <div class=\"small-3 columns\">\n        <button class=\"clear-filter postfix\">clear</button>\n    </div>\n</div>");
      select = $('<select>').addClass('companies').appendTo(this.el);
      addCompany = function(){
        return bind$(select, 'append')(function(it){
          return "<option>" + it + "</option>";
        }(function(it){
          return it.get('name');
        }.apply(this, arguments)));
      };
      this.collection.each(addCompany);
      this.$el.append("<select class=\"layout\">\n    <option value=\"BT\">Vertical</option>\n    <option value=\"LR\">Horizontal</option>\n    <option value=\"TB\">Inverse Vertical</option>\n    <option value=\"RL\">Inverse Horizontal</option>\n</select>");
      this.$el.append("<button class=\"small add-contractors\">Add contractors</button>");
      this.$el.append("<button class=\"small add-secretaries\">Add secretaries</button>");
      this.$el.append("<button class=\"small add-banks\">Add banks</button>");
      this.$el.append("<label>\n    <input type=\"checkbox\" class=\"align-attrs\">\n    Align attributes\n</label>\n<label>\n    <input type=\"checkbox\" checked class=\"show-attrs\">\n    Show attributes\n</label>");
      this.$el.append("<div class=\"section-container auto\" data-section>\n  <section class=\"active\">\n    <p class=\"title\" data-section-title><a href=\"#\">Filter By Path</a></p>\n    <div class=\"content paths\" data-section-content>\n    </div>\n  </section>\n  <section class=\"active\">\n    <p class=\"title\" data-section-title><a href=\"#\">Filter By Type</a></p>\n    <div class=\"content classes\" data-section-content>\n    </div>\n  </section>\n</div>");
      this.classes.each(bind$(this, 'insertClass'));
      return this.paths.each(bind$(this, 'insertPath'));
    };
    prototype.addClass = function(cls){
      if (!this.classes.any(function(c){
        return cls === c.get('name');
      })) {
        return this.classes.add({
          name: cls
        });
      }
    };
    prototype.insertClass = function(cls){
      this.$('.classes').append("<label>\n    <input type=\"checkbox\" value=\"" + cls.escape('name') + "\" checked=" + cls.get('hidden') + "/>\n    " + cls.escape('name') + "\n</label>");
      return $(document).foundation('section', 'reflow');
    };
    prototype.insertPath = function(pth){
      var humanPath;
      humanPath = join(' > ', split('.', pth.get('path')));
      this.$('.paths').append("<label>\n    <input type=\"checkbox\" value=\"" + pth.escape('path') + "\" checked=" + pth.get('hidden') + "/>\n    " + humanPath + "\n</label>");
      return $(document).foundation('section', 'reflow');
    };
    prototype.events = function(){
      return {
        'click .clear-filter': function(e){
          e.preventDefault();
          return this.$('.find').val(null);
        },
        'keyup .find': function(e){
          return this.trigger('filter', e.target.value);
        },
        'change .companies': function(e){
          this.trigger('chosen:company', $(e.target).val());
          return $(e.target).blur();
        },
        'click .align-attrs': function(e){
          return this.trigger('align:attrs', this.$('.align-attrs').is(':checked'));
        },
        'click .show-attrs': function(e){
          return this.trigger('hide:attrs', !this.$('.show-attrs').is(':checked'));
        },
        'click .classes': function(e){
          var hide;
          hide = this.$('.classes input').filter(':not(:checked)').map(function(){
            return $(this).val();
          }).get();
          return this.classes.each(function(cls){
            return cls.set({
              hidden: in$(cls.get('name'), hide)
            });
          });
        },
        'click .paths': function(e){
          var hide;
          hide = this.$('.paths input').filter(':not(:checked)').map(function(){
            return $(this).val();
          }).get();
          return this.paths.each(function(pth){
            return pth.set({
              hidden: in$(pth.get('path'), hide)
            });
          });
        },
        'change .layout': function(e){
          this.trigger('chosen:layout', $(e.target).val());
          return $(e.target).blur();
        },
        'click .add-contractors': function(e){
          e.preventDefault();
          return this.trigger('show:contractors', this.$('.companies').val());
        },
        'click .add-secretaries': function(e){
          e.preventDefault();
          return this.trigger('show:secretaries', this.$('.companies').val());
        },
        'click .add-banks': function(e){
          e.preventDefault();
          return this.trigger('show:banks', this.$('.companies').val());
        }
      };
    };
    function Settings(){
      this.insertClass = bind$(this, 'insertClass', prototype);
      Settings.superclass.apply(this, arguments);
    }
    return Settings;
  }(Backbone.View));
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
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
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
