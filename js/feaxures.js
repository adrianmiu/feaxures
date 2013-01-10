/**
 * Feaxures JS - progressive enhancement, done right!
 * @license - MIT http://opensource.org/licenses/MIT
 * @copyright - Adrian Miu www.adrianmiu.ro
 */

/**
 * AMD & globals module
 * @see https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], function (jQuery) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Feaxures = factory(jQuery));
        });
    } else {
        // Browser globals
        root.Feaxures = factory(root.jQuery);
    }
}(this, function (jQuery) {

    /**
     * taken from http://phpjs.org/functions/parse_str/
     * improved so it converts strings like 'true' and 'false' to boolean values
     * and numbers into numbers
     */
    var parse_str = function(str, array) {
  // %        note 1: When no argument is specified, will put variables in global scope.
  // %        note 1: When a particular argument has been passed, and the returned value is different parse_str of PHP. For example, a=b=c&d====c
  // *     example 1: var arr = {};
  // *     example 1: parse_str('first=foo&second=bar', arr);
  // *     results 1: arr == { first: 'foo', second: 'bar' }
  // *     example 2: var arr = {};
  // *     example 2: parse_str('str_a=Jack+and+Jill+didn%27t+see+the+well.', arr);
  // *     results 2: arr == { str_a: "Jack and Jill didn't see the well." }
  // *     example 3: var abc = {3:'a'};
  // *     example 3: parse_str('abc[a][b]["c"]=def&abc[q]=t+5');
  // *     results 3: JSON.stringify(abc) === '{"3":"a","a":{"b":{"c":"def"}},"q":"t 5"}';


  var strArr = String(str).replace(/^&/, '').replace(/&$/, '').split('&'),
    sal = strArr.length,
    i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
    postLeftBracketPos, keys, keysLen,
    fixStr = function (str) {
      return decodeURIComponent(str.replace(/\+/g, '%20'));
    };

  if (!array) {
    array = this.window;
  }

  for (i = 0; i < sal; i++) {
    tmp = strArr[i].split('=');
    key = fixStr(tmp[0]);
    value = (tmp.length < 2) ? '' : fixStr(tmp[1]);
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (value == parseInt(value)) {
      value = parseInt(value);
    } else if (value == parseFloat(value)) {
      value = parseFloat(value);
    }

    while (key.charAt(0) === ' ') {
      key = key.slice(1);
    }
    if (key.indexOf('\x00') > -1) {
      key = key.slice(0, key.indexOf('\x00'));
    }
    if (key && key.charAt(0) !== '[') {
      keys = [];
      postLeftBracketPos = 0;
      for (j = 0; j < key.length; j++) {
        if (key.charAt(j) === '[' && !postLeftBracketPos) {
          postLeftBracketPos = j + 1;
        }
        else if (key.charAt(j) === ']') {
          if (postLeftBracketPos) {
            if (!keys.length) {
              keys.push(key.slice(0, postLeftBracketPos - 1));
            }
            keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
            postLeftBracketPos = 0;
            if (key.charAt(j + 1) !== '[') {
              break;
            }
          }
        }
      }
      if (!keys.length) {
        keys = [key];
      }
      for (j = 0; j < keys[0].length; j++) {
        chr = keys[0].charAt(j);
        if (chr === ' ' || chr === '.' || chr === '[') {
          keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
        }
        if (chr === '[') {
          break;
        }
      }

      obj = array;
      for (j = 0, keysLen = keys.length; j < keysLen; j++) {
        key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '');
        lastIter = j !== keys.length - 1;
        lastObj = obj;
        if ((key !== '' && key !== ' ') || j === 0) {
          if (obj[key] === undef) {
            obj[key] = {};
          }
          obj = obj[key];
        }
        else { // To insert new dimension
          ct = -1;
          for (p in obj) {
            if (obj.hasOwnProperty(p)) {
              if (+p > ct && p.match(/^\d+$/g)) {
                ct = +p;
              }
            }
          }
          key = ct + 1;
        }
      }
      lastObj[key] = value;
    }
  }
};

    var _config         = {},
        // list of loaded features
        _loadedFeatures = {},
        // list of registered features
        _features       = {},
        _events,
        // array traversing function that can be changed if you're not using jQuery
        _each           = jQuery.each,
        // load function (can be replaced with something else as long as the files are provided in the proper format)
        // Modernizr.load or any other resource loader may be used for this as long as the function accepts 3 arguments
        // 1. a list of resources to be loaded
        // 2. a success callback
        // 3. a fail callback (optional)
        _load           = require;

    var Feaxures = function(config) {
        this.config(config);
        _events = $(this);
        return this;
    };

    /**
     * Event handlers using jQuery.Callbacks
     */
    Feaxures.prototype.on = function(eventName, method) {
        _events.on.apply(_events, arguments);
        return this;
    };

    Feaxures.prototype.one = function(eventName, method) {
        _events.one.apply(_events, arguments);
        return this;
    };

    Feaxures.prototype.off = function(eventName, method) {
        _events.off.apply(_events, arguments);
        return this;
    };

    Feaxures.prototype.trigger = function(eventName) {
        _events.trigger.apply(_events, arguments);
    };

    /**
     * Sets/retrieves configuration options. The list of all available options below
     * - debug: activate/deactivates the debug mode (some log messages are sent to the console)
     * - onBeforeAttach: callback(element, feature, options) called before a feature is applied to a DOM element
     * - onAfterAttach: callback(element, feature, options) called after a feature is applied to a DOM element
     * - onLoad: callback(feature) called after a feature is loaded
     * - onLoadError: callback(feature, error) called if a feature cannot be loaded
     *
     * @param  {String|Object} config   an object to set the configuration, a string to retrieve a configuration
     * @param  {mixed}         value    (optional) to set the configuration value of a single option
     * @return {String|Object}
     */
    Feaxures.prototype.config = function(config) {
        if ($.isPlainObject(config)) {
            _config = $.extend(_config, config);
        } else if (typeof(config) == 'string') {

            if (arguments.length === 1) {
                return _config[config] || false;
            } else {
                _config[config] = arguments[1];
            }
        } else if (config === undefined) {
            return _config;
        }
        return this;
    };

    /**
     * Simple function to log messages if the debug mode is active
     */
    Feaxures.prototype.log = function() {
        if (this.config('debug') && typeof(console.log) == 'function') {
            console.log.apply(console, arguments);
        }
    };
    
    /**
     * Tests if a feature is registered
     * @param  {String}  feature
     * @return {Boolean}
     */
    Feaxures.prototype.isRegistered = function(feature) {
        return _features[feature] ? true : false;
    };

    /**
     * Registers a feature
     * @param  {String} feature name of the feature
     * @param  {Object} options configuration options
     * @return self
     */
    Feaxures.prototype.register = function(feature, options) {
        options = $.extend({
            // auto-load the feature
            'autoLoad'    : false,
            // the 'selector' can be used to optimize quering the DOM
            'selector'    : '[data-fxr-' + feature + ']',
            // files needed by this feature, provided as the loader understands them
            'files'       : [],
            // default options for the feature
            'defaults'    : {},
            // when to attach the elements (domready, click, hover, focus)
            'attachEvent' : 'domready',
            // callback to be executed after the feature's files are loaded
            'onLoad'      : null,
            // callback to be executed if there are errors while loading the files
            'onLoadError' : null,
            // callback to be executed before a feature is applied to a DOM element
            // if it returns false the feature is not applied anymore
            'onBeforeAttach' : null,
            // callback to be executed after a feature is applied to  a DOM element
            'onAfterAttach'  : null
        }, options, {'name': feature});
        if (typeof options.onLoad === 'function') {
            this.on('load:' + feature, options.onLoad);
        }
        if (typeof options.onLoadError === 'function') {
            this.on('loadError:' + feature, options.onLoadError);
        }
        if (typeof options.onBeforeAttach === 'function') {
            this.on('onBeforeAttach:' + feature, options.onBeforeAttach);
        }
        if (typeof options.onAfterAttach === 'function') {
            this.on('onAfterAttach:' + feature, options.onAfterAttach);
        }
        _features[feature] = options;
    };
    
    /**
     * tests if a feature has been loaded
     * @param  {String}  feature
     * @return {Boolean}
     */
    Feaxures.prototype.isLoaded = function(feature) {
        return _loadedFeatures[feature] ? true : false;
    };
    
    /**
     * [load description]
     * @param  {String}   feature  name of the feature
     * @param  {Function} callback function to be executed after the feature is loaded
     */
    Feaxures.prototype.load = function(feature, callback) {
        var self = this;
        if (!this.isRegistered(feature)) {
            this.log('Feature ' + feature + ' is not registered');
            return;
        }
        if (typeof(callback) !== 'function') {
            callback = function() { return; };
        }
        
        if (this.isLoaded(feature)) {
            callback.apply(self);
            return;
        }

        var featureDefinition = _features[feature];
        _load(featureDefinition.files, function() {
            _loadedFeatures[feature] = true;
            self.log('Feature ' + feature + ' was loaded');
            self.trigger('load', feature);
            self.trigger('load:' + feature);
            callback.apply(callback.prototype);
        }, function(err) {
            self.log('Error loading feature ' + feature);
            self.trigger('loadError', feature);
            self.trigger('loadError:' + feature);
        });
    };
    
    /**
     * Attach a feature on a selection of DOM elements
     * @param  {String}   feature     the name of the feature
     * @param  {Array}    domElements a simple array or jQuery selection
     * @return self
     */
    Feaxures.prototype.attach = function(feature, domElements) {
        var self = this,
            featureDefinition = _features[feature];
        // no point in going further if there are no domElements
        if (!domElements.length || domElements.length < 1) {
            return;
        }
        if (!this.isLoaded(feature)) {
            this.load(feature, function() {
                self.attach(feature, domElements);
            });
            return;
        }
        _each(domElements, function(index, element) {
            var $this = $(this),
                options = $this.attr('data-fxr-'+feature),
                alreadyAttached = ($this.data('fxt.'+feature) !== null && $this.data('fxt.'+feature) !== undefined);

            // feature is already loaded or it doesn't have an attach() method
            if (alreadyAttached || !featureDefinition.attach || typeof featureDefinition.attach !== 'function') {
                return;
            }
            options = self.getFeatureOptionsForElement(options, this);

            if (options !== false) {
                // add the defaults to the options list
                options = $.extend({}, featureDefinition.defaults,  options);

                // global onBeforeAttach event
                var e = jQuery.Event('onBeforeAttach');
                e.target = element;
                e.feature = feature;
                e.options = options;
                self.trigger(e);
                if (e.result === false || e.isDefaultPrevented()) {
                    $this.attr('data-fxr-'+feature, null);
                    $this.data('fxt.'+feature, false); // we need this so we don't try to apply the feature again
                    self.log('Feature ' + feature + ' was not applied because the global onBeforeAttach() returned false');
                    return;
                }

                // feature's onBeforeAttach callback
                e = jQuery.Event('onBeforeAttach:' + feature);
                e.target = element;
                e.feature = feature;
                e.options = options;
                self.trigger(e);
                if (e.result === false || e.isDefaultPrevented()) {
                    $this.attr('data-fxr-'+feature, null);
                    $this.data('fxt.'+feature, false); // we need this so we don't try to apply the feature again
                    self.log('Feature ' + feature + ' was not applied because the feature\'s onBeforeAttach() returned false');
                    return;
                }

                featureDefinition.attach.call(self, element, options);
                self.log('Feature ' + feature + ' was applied to element', element);

                // feature's onAfterAttach callback
                e = jQuery.Event('onAfterAttach:' + feature);
                e.target = element;
                e.feature = feature;
                e.options = options;
                self.trigger(e);
                // global onAfterAttach callback
                e = jQuery.Event('onAfterAttach');
                e.target = element;
                e.feature = feature;
                e.options = options;
                self.trigger(e);
            }
            // clear the element attribute so discover() will not find it again
            $this.attr('data-fxr-'+feature, null);
            // store the computed options for further reference
            // (eg: load more features depending on the existing features)
            $this.data('fxt.'+feature, options);
        });
        return this;
    };

    /**
     * features are specified within a data-fxr-featureName attribute
     * and it can be a:
     * 1. Selector if preceded by #. We will use the HTML content of the corresponding DOM element
     * 2. JSON string if it starts with '{'
     * 3. A funtion to be evaled if the string starts with 'function'
     * 4. A string like a URL query string (eg: 'var=option&another_var=another_value
     * 5. A 'true' or empty string to signify the feature is applicable to the element
     * 6. A 'false' string to signify the feature is not applicable
     * @param {Object|String}   options
     * @param {DOM Element}     domElement    used if the 'options' converts into a function that will be called with the domElement as argument
     * @returns {Object}        computed feature options
     */
    Feaxures.prototype.getFeatureOptionsForElement = function(options, domElement) {
        if (options === 'false') {
            return false;
        } else if (options === 'true' || options === '') {
            return {};
        } else if (options.substr(0,1) == '#') {
            options = $(options).text();
        }
        options = jQuery.trim(options);
        if (options.substr(0, 1) == '{') {
            var o = {};
            eval('o = ' + options + ';');
            options = o;
        } else if (options.substr(0, 8) == 'function') {
            var funcName = '_tmpFunc' + Math.floor(Math.random()*1000000);
            $.globalEval('var ' + funcName + ' = ' + options);
            if (typeof window[funcName] !== 'function') {
                self.log('value could not be converted into a function: ' + options);
                return false;
            }
            options = window[funcName].call(null, domElement);
            window[funcName] = void 0; delete window[funcName]; // clean up
        } else {
            var arr = {};
            parse_str(options, arr);
            options = arr;
        }
        return options;
    };

    /**
     * Discover DOM elements that have features on a container
     * @param  {selector/DOM element}   container
     * @return self
     */
    Feaxures.prototype.discover = function(container) {
        var self = this;
        if (typeof(container) === 'string') {
            container = $(container);
        }
        _each(_features, function(index, value) {
            if (value.attachEvent === 'domready') {
              self.attach(index, $(value.selector, container));
            }
        });
        return this;
    };

    /**
     * Initialize the features
     * - loads the features that are set to be auto-loaded
     * - attaches callbacks on domReady and dom:changed events
     * - delegates the feaxures.load events on the DOM
     * @return self
     */
    Feaxures.prototype.initialize = function() {
        var self = this;
        // autoload the appropriate features
        _each(_features, function(index, value) {
            if (value.autoLoad === true && !_loadedFeatures[value.name]) {
                self.load(value.name);
            }
        });
        // register the discover() method on domReady and dom:changed event
        jQuery(function() {
            self.discover('body');
            jQuery('body').on('dom:changed', function() {
                self.discover('body');
            });
            _each(_features, function(index, feature) {
                _each(['click', 'focus', 'mouseover'], function(i, evt) {
                    if (evt === feature.attachEvent) {
                        $('body').one(evt+'.feaxures', feature.selector, function(ev, data) {
                              var elements = $(feature.selector).not($(ev.currentTarget));

                              self.on('onAfterAttach:' + feature.name, function(e) {
                                  // we use ev.target to determine the exact element which triggered the event
                                  console.log(ev.target, evt, e);
                                  $(ev.target).trigger(evt);
                              });

                              // attach the feaxure to the rest of elements
                              // we are doing on onBeforeAttach because a callback may prevent the feaxure for being added to the
                              // element that has triggered the event and onAfterAttach will not be called anymore
                              self.one('onBeforeAttach:' + feature.name, function() {
                                  self.attach(feature.name, elements);
                              });
                              
                              // we attch the feature only on the target now 
                              // we use ev.currentTarget to determine the element to which event was bounded
                              self.attach(feature.name, $(ev.currentTarget));
                              ev.stopPropagation();
                              ev.preventDefault();
                        });
                    }
                });
            });
        });
        return this;
    };

    return Feaxures;
}));
