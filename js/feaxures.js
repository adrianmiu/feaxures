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
        define('feaxures', function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.

            return (root.Feaxures = factory());
        });
    } else {
        // Browser globals
        root.Feaxures = factory();
    }
}(this, function () {
    "use strict";
    /**
     * taken from http://phpjs.org/functions/parse_str/
     * improved so it converts strings like 'true' and 'false' to boolean values
     * and numbers into numbers
     */
    var parseQueryString = function(str, array) {
    // %        note 1: When no argument is specified, will put variables in global scope.
    // %        note 1: When a particular argument has been passed, and the returned value is different parseQueryString of PHP. For example, a=b=c&d====c
    // *     example 1: var arr = {};
    // *     example 1: parseQueryString('first=foo&second=bar', arr);
    // *     results 1: arr == { first: 'foo', second: 'bar' }
    // *     example 2: var arr = {};
    // *     example 2: parseQueryString('str_a=Jack+and+Jill+didn%27t+see+the+well.', arr);
    // *     results 2: arr == { str_a: "Jack and Jill didn't see the well." }
    // *     example 3: var abc = {3:'a'};
    // *     example 3: parseQueryString('abc[a][b]["c"]=def&abc[q]=t+5');
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
        } else if (value == parseInt(value, 10)) {
          value = parseInt(value, 10);
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

    // Evaluates a script in a global context
  	// Workarounds based on findings by Jim Driscoll
  	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
  	var globalEval = function( data ) {
  		if ( data && jQuery.trim( data ) ) {
  			// We use execScript on Internet Explorer
  			// We use an anonymous function so that context is window
  			// rather than jQuery in Firefox
  			( window.execScript || function( data ) {
  				window[ "eval" ].call( window, data );
  			} )( data );
  		}
  	};
    
    /**
     * Minimalist implementation of Promises. Borrowed from here:
     * https://gist.github.com/814052/690a6b41dc8445479676b347f1ed49f4fd0b1637
     * This will be used in case the $.Deferred is missing (ie: zepto instead of jQuery)
     * @returns {_L25.Promise}
     */
    function Deferred () {
        this._thens = [];
    }
    Deferred.prototype = {

        /* This is the "front end" API. */

        // then(onResolve, onReject): Code waiting for this promise uses the
        // then() method to be notified when the promise is complete. There
        // are two completion callbacks: onReject and onResolve. A more
        // robust promise implementation will also have an onProgress handler.
        then: function (onResolve, onReject) {
            // capture calls to then()
            this._thens.push({ resolve: onResolve, reject: onReject });
            return this;
        },

        done: function(onResolve) {
            return this.then(onResolve, null);
        },
                
        fail: function(onReject) {
            return this.then(null, onReject);
        },
                
        always: function(onAnything) {
            return this.then(onAnything, onAnything);
        },
                
        promise: function() {
            var self = this,
                promise = {
                    done: function() { return self.done.apply(self, arguments); },
                    fail: function() { return self.fail.apply(self, arguments); },
                    always: function() { return self.always.apply(self, arguments); }
                };
            return promise;
        },

        // Some promise implementations also have a cancel() front end API that
        // calls all of the onReject() callbacks (aka a "cancelable promise").
        // cancel: function (reason) {},

        /* This is the "back end" API. */

        // resolve(resolvedValue): The resolve() method is called when a promise
        // is resolved (duh). The resolved value (if any) is passed by the resolver
        // to this method. All waiting onResolve callbacks are called
        // and any future ones are, too, each being passed the resolved value.
        resolve: function (val) { this._complete('resolve', val); },
                
        resolveWith: function(obj, val) { this._complete('resolve', val, obj); },

        // reject(exception): The reject() method is called when a promise cannot
        // be resolved. Typically, you'd pass an exception as the single parameter,
        // but any other argument, including none at all, is acceptable.
        // All waiting and all future onReject callbacks are called when reject()
        // is called and are passed the exception parameter.
        reject: function (ex) { this._complete('reject', ex); },
                
        rejectWith: function (obj, ex) { this._complete('reject', ex, obj); },

        // Some promises may have a progress handler. The back end API to signal a
        // progress "event" has a single parameter. The contents of this parameter
        // could be just about anything and is specific to your implementation.
        // progress: function (data) {},

        /* "Private" methods. */

        _complete: function (which, arg, obj) {
            // switch over to sync then()
            this.then = which === 'resolve' ?
                function (resolve, reject) { resolve(arg); } :
                function (resolve, reject) { reject(arg); };
            // disallow multiple calls to resolve or reject
            this.resolve = this.reject = 
                function () { throw new Error('Promise already completed.'); };
            // complete all waiting (async) then()s
            var aThen, i = 0;
            while (aThen = this._thens[i++]) { aThen[which] && aThen[which].call(obj || null, arg); }
            delete this._thens;
        }

    };

    var isObject = function(obj) {
        return obj === Object(obj);
    };
    
    var isArray = Array.isArray || function(obj) {
        return toString.call(obj) == '[object Array]';
    };

    var _each           = $.each,
        // load function (can be replaced with something else as long as the files are provided in the proper format)
        // Modernizr.load or any other resource loader may be used for this as long as the function accepts 3 arguments
        // 1. a list of resources to be loaded
        // 2. a success callback
        // 3. a fail callback (optional)
        _load           = window.require,
        Deferred        = (window.jQuery && window.jQuery.Deferred) ? function() { return jQuery.Deferred();} : Deferred;

    var Feaxures = function(config) {
        // event hanlder using jQuery
        this._events         = $(document);
        // list of loaded features
        this._loadedFeatures = {};
        // list of registered features
        this._features       = {};
        // configuration options
        this._config         = {};
        this.config(config);
        return this;
    };

    /**
     * Event handlers using $.Callbacks
     */
    Feaxures.prototype.on = function(eventName, method) {
        this._events.on(eventName, method);
        return this;
    };

    Feaxures.prototype.one = function(eventName, method) {
        this._events.one(eventName, method);
        return this;
    };

    Feaxures.prototype.off = function(eventName, method) {
        this._events.off(eventName, method);
        return this;
    };

    Feaxures.prototype.trigger = function() {
        this.log('Event "' + arguments[0].type + '" was called');
        this._events.trigger.apply(this._events, arguments);
    };

    /**
     * Sets/retrieves configuration options. The list of all available options below
     * - debug: activate/deactivates the debug mode (some log messages are sent to the console)
     *
     * @param  {String|Object} config   an object to set the configuration, a string to retrieve a configuration
     * @param  {mixed}         value    (optional) to set the configuration value of a single option
     * @return {String|Object}
     */
    Feaxures.prototype.config = function(config) {
        if ($.isPlainObject(config)) {
            this._config = $.extend(this._config, config);
        } else if (typeof(config) == 'string') {

            if (arguments.length === 1) {
                return this._config[config] || false;
            } else {
                this._config[config] = arguments[1];
            }
        } else if (config === undefined) {
            return this._config;
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
     * Checks if a feature is registered
     * @param  {String}  feature
     * @return {Boolean}
     */
    Feaxures.prototype.isRegistered = function(feature) {
        return feature && this._features[feature] ? true : false;
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
            // DOM event when to attach the elements (domready, click, hover, focus)
            'attachEvent' : 'domready',
            // condition to check whether the feature should be attached to the element
            // must be truthy or a callback that returns a truthy value
            // if it's a function it will be used to determine if the feature should be detached as well
            // assuming the feature's detach property is a function
            'attachCondition': true,
            'detach'      : null,
            // callback to be executed after the feature's files are loaded
            'onLoad'      : null,
            // callback to be executed if there are errors while loading the files
            'onLoadError' : null,
            // callback to be executed after a feature is applied to a DOM element
            'onAttach'    : null,
            // callback to be executed after a feature is removed from a DOM element
            'onDetach'    : null
        }, options, {'name': feature});
        if (typeof options.onLoad === 'function') {
            this.on('load:' + feature, options.onLoad);
        }
        if (typeof options.onLoadError === 'function') {
            this.on('loadError:' + feature, options.onLoadError);
        }
        if (typeof options.onAttach === 'function') {
            this.on('attach:' + feature, options.onAttach);
        }
        if (typeof options.onDetach === 'function') {
            this.on('detach:' + feature, options.onDetach);
        }
        this._features[feature] = options;
    };

    /**
     * tests if a feature has been loaded
     * @param  {String}  feature
     * @return {Boolean}
     */
    Feaxures.prototype.isLoaded = function(feature) {
        return this._loadedFeatures[feature] ? true : false;
    };

    /**
     * [load description]
     * @param  {String}   feature  name of the feature
     * @param  {Function} callback function to be executed after the feature is loaded
     * @return jQuery promise
     */
    Feaxures.prototype.load = function(feature, callback) {
        var self = this;
        var dfd = new Deferred();

        if (!this.isRegistered(feature)) {
            this.log('Feaxure ' + feature + ' is not registered');
            dfd.rejectWith(self, ['Feaxure ' + feature + ' is not registered']);
            return dfd.promise();
        }

        var featureDefinition = this._features[feature];
        if (typeof(featureDefinition.files) === 'function') {
            featureDefinition.files = featureDefinition.files.call(this);
        }
        if (!isArray(featureDefinition.files)) {
            this.log('The feaxure "' + feature + '" does not have a valid list of dependencies');
            dfd.rejectWith(self, ['The feaxure "' + feature + '" does not have a valid list of dependencies']);
            return dfd.promise();
        }

        if (typeof(callback) === 'function') {
            dfd.done(callback);
        }

        // feature is already marked as loaded? resolve and return the promise
        if (this._loadedFeatures[feature] === true) {
            dfd.resolveWith(self);
            return dfd.promise();
        } else if (this._loadedFeatures[feature] === false) {
            dfd.rejectWith(self);
            return dfd.promise();
        }


        // mark the feature as loaded and trigger the appropriate events
        dfd.done(function(){
            // feature is already loaded; don't trigger the events again
            if (this._loadedFeatures[feature] === true) {
                return;
            }
            this._loadedFeatures[feature] = true;
            self.log('Feaxure ' + feature + ' was loaded');

            var e = $.Event('load');
            e.feature = feature;
            self.trigger(e);

            e = $.Event('load:' + feature);
            e.feature = feature;
            self.trigger(e);
        });

        dfd.fail(function(err){
            // feature is already failed loading; don't trigger the events again
            if (this._loadedFeatures[feature] === false) {
                return;
            }
            this._loadedFeatures[feature] = false;
            self.log('Error loading feaxure ' + feature);

            var e = $.Event('loadError');
            e.feature = feature;
            self.trigger(e);

            e = $.Event('loadError:' + feature);
            e.feature = feature;
            self.trigger(e);
        });

        _load(featureDefinition.files, function() {
            dfd.resolveWith(self, ['Feaxure ' + feature + ' was loaded']);
        }, function(err) {
            self.log('Error loading feaxure ' + feature, err);
            dfd.rejectWith(self, [err]);
        });

        return dfd.promise();
    };

    Feaxures.prototype._detachFromElement = function(feature, element) {
        var self = this,
            $el = $(element),
            featureDefinition = this._features[feature],
            isDetachable = false;

        isDetachable = typeof featureDefinition.attachCondition === 'function' &&
              typeof featureDefinition.detach === 'function' &&
              featureDefinition.attachCondition.call(featureDefinition, element) == false;

        if (!isDetachable) {
            return;
        }

        featureDefinition.detach.call(this, element);
        $el.data('fxr.'+feature, null);
        this.log('Feaxure ' + feature + ' was applied to element', element);

        // the feature is detached, remove the event callback
        $('body').off('dom:changed', function() {
          self._detachFromElement(feature, element);
      });

        // feature's onAttach event
        var e = $.Event('detach:' + feature);
        e.element = element;
        e.feature = feature;
        this.trigger(e);

        // global onAttach event
        e = $.Event('detach');
        e.element = element;
        e.feature = feature;
        this.trigger(e);
    };

    /**
     * Attach a feature to an element. Assumes the files are already loaded.
     * 
     * @param  {object}      -featureDefinition
     * @param  {DOMelement} element
     * @return {void}
     */
    Feaxures.prototype._attachToElement = function(feature, element) {
        var self = this,
            $el = $(element),
            featureDefinition = this._features[feature],
            // allow for feature's default options to be a function
            defaults = (typeof featureDefinition.defaults === 'function') ? featureDefinition.defaults.call(self, element) : featureDefinition.defaults,
            options = $el.attr('data-fxr-'+feature),
            alreadyAttached = ($el.data('fxr.'+feature) !== null && $el.data('fxr.'+feature) !== undefined);

        // feature is already loaded or it doesn't have an attach() method
        if (alreadyAttached) {
            return;
        }
        var isAttachable = typeof featureDefinition.attachCondition === 'function' ?
                featureDefinition.attachCondition.call(featureDefinition, element) :
                featureDefinition.attachCondition;
        var isDetachable = typeof featureDefinition.attachCondition === 'function' && typeof featureDefinition.detach === 'function';
        // feature is attachable?
        if (!isAttachable) {
            return;
        }

        options = this.getFeatureOptionsForElement(feature, element);

        if (options !== false) {
            // add the defaults to the options list
            options = $.extend({}, defaults,  options);

            featureDefinition.attach.call(this, element, options);
            // store the computed options for further reference
            $el.data('fxr.'+feature, options);
            this.log('Feaxure ' + feature + ' was applied to element', element);

            if (isDetachable) {
                $('body').on('dom:changed', function() {
                    self._detachFromElement(feature, element);
                });
            }

            // feature's onAttach event
            var e = $.Event('attach:' + feature);
            e.element = element;
            e.feature = feature;
            e.options = options;
            this.trigger(e);

            // global onAttach event
            e = $.Event('attach');
            e.element = element;
            e.feature = feature;
            e.options = options;
            this.trigger(e);
        }
    };

    /**
     * Attach a feature on a selection of DOM elements
     * @param  {String}   feature     the name of the feature
     * @param  {Array}    domElements a simple array or jQuery selection
     * @return self
     */
    Feaxures.prototype.attach = function(feature, domElements) {
        var self = this,
            featureDefinition = this._features[feature],
            enhanceableElements = 0,
            loadPromise = this.load(feature),
            dfd = new Deferred();

        // we don't have a proper attach() callback
        if (!featureDefinition.attach || typeof featureDefinition.attach !== 'function') {
            dfd.fail(function(message) {
                self.log(message);
            });
            dfd.rejectWith(self, ['Feaxure "' + feature + '" does not have an attach() method.']);
            return dfd.promise();
        }

        // no point in going further if there are no domElements
        if (!domElements.length || domElements.length < 1) {
            dfd.done(function(message) {
                self.log(message);
            });
            dfd.resolve('Feaxure "' + feature + '" has no elements to be applied to.');
            return dfd.promise();
        }
        // first we need to determine if there are elements that need to be enhanced
        _each(domElements, function(index, element) {
            var $this = $(this),
                options = self.getFeatureOptionsForElement(feature, this);
            if (options !== false) {
                enhanceableElements++;
            }
        });
        if (enhanceableElements === 0) {
            dfd.done(function(message) {
                self.log(message);
            });
            dfd.resolveWith(self, ['Feaxure "' + feature + '" has no elements to be applied to.']);
            return dfd.promise();
        }

        loadPromise.done(function() {
          _each(domElements, function(index, element) {
            self._attachToElement(feature, element);
          });
          dfd.resolveWith(self, [{feaxureName: feature}]);
        });
        return dfd.promise();
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
    Feaxures.prototype.getFeatureOptionsForElement = function(feature, domElement) {
        var options = $(domElement).attr('data-fxr-' + feature);
        if (options === 'false') {
            return false;
        } else if (options === 'true' || options === '') {
            return {};
        } else if (options.substr(0,1) == '#') {
            options = $(options).text();
        }
        options = $.trim(options);
        if (options.substr(0, 1) == '{') {
            var o = {};
            eval('o = ' + options + ';');
            options = o;
        } else if (options.substr(0, 8) == 'function') {
            var funcName = '_tmpFunc' + Math.floor(Math.random()*1000000);
            globalEval('var ' + funcName + ' = ' + options);
            if (typeof window[funcName] !== 'function') {
                self.log('value could not be converted into a function: ' + options);
                return false;
            }
            options = window[funcName].call(null, domElement);
            window[funcName] = void 0; delete window[funcName]; // clean up
        } else {
            var arr = {};
            parseQueryString(options, arr);
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
        var self = this,
            feaxuresCount = 0,
            feaxuresAttached = 0,
            dfd = new Deferred();
        if (typeof(container) === 'string') {
            container = $(container);
        }
        _each(this._features, function(index, value) {
            if (value.attachEvent === 'domready') {
              feaxuresCount++;
            }
        });
        _each(this._features, function(index, value) {
            if (value.attachEvent === 'domready') {
              self.attach(index, $(value.selector, container)).always(function() {
                  feaxuresAttached++;
                  if (feaxuresAttached === feaxuresCount) {
                      dfd.resolveWith(self, [{feaxuresAttached: feaxuresAttached}]);
                  }
              });
            }
        });
        return dfd.promise();
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
        _each(this._features, function(index, value) {
            if (value.autoLoad === true && !self._loadedFeatures[value.name]) {
                self.load(value.name);
            }
        });
        // register the discover() method on domReady and dom:changed event
        jQuery(function() {
            self.discover('body');
            jQuery('body').on('dom:changed', function() {
                self.discover('body');
            });
            jQuery(window).on('resize', function() {
                jQuery('body').trigger('dom:changed');
            });
            _each(self._features, function(featureName, feature) {
                _each(['click', 'focus', 'mouseover'], function(i, evt) {
                    if (evt === feature.attachEvent) {
                        $('body').on(evt+'.feaxures', feature.selector, function(ev, data) {
                              // if the current element is not a candidate for the feature, return asap
                              if (self.getFeatureOptionsForElement(featureName, ev.currentTarget) === false) {
                                  return;
                              }
                              ev.stopPropagation();
                              ev.preventDefault();

                              var elements = $(feature.selector).not($(ev.currentTarget));
                              self.attach(featureName, $(ev.currentTarget));

                              self.one('attach:' + featureName, function(e) {
                                  // remove the delegated event to prevent from being executed again
                                  $('body').off(evt+'.feaxures', feature.selector, ev.handler);
                                  // trigger the event again
                                  $(ev.target).trigger(evt);
                                  // attach feature the to rest of the matching elements
                                  self.attach(featureName, elements);
                              });
                        });
                    }
                });
            });
        });
        return this;
    };

    return Feaxures;
}));
