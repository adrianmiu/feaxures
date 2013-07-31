(function(root, undefined){
	"use strict";

	var __hasOwnProperty = Object.prototype.hasOwnProperty;

	// utility function to compare 2 callbacks
	var __compareCallbacks = function(c1, c2) {
		if (c1.priority < c2.priority) {
			return -1;
		} else if (c1.priority > c2.priority) {
			return 1;
		}
		return 0;
	};
	
	// method to reorder the callbacks based on their priorities
	// will be called after an callback is added to the registry
	var __updateCallbacksOrder = function() {
		this._registry.sort(__compareCallbacks);
	};
	
	// function to execute a callback (an object from the callbacks registry)
	/**
	 * 
	 * @param clbk		callback object (from the stack)
	 * @param args		callback parameters
	 * @param defaultContext context for the execution of the callback
	 */
	var __executeCallback = function(clbk, args, defaultContext) {
		var context = clbk.context || defaultContext || this;
		return clbk.callback.apply(context, args);
	};
	
	// if a callback throws this exception the rest of the callbacks will not be executed
	root.CallbacksBreakExecutionException = function(message) {
		this.message = message; 
		this.stack = Error().stack;
	}
	root.CallbacksBreakExecutionException.prototype =  new Error;
	
	root.Callbacks = function(flags) {
		// flags are options that alter the behaviour of the callback
		// unique: does not allow adding the same function to the registry
		// once: the callbacks are executed only once. Any subsequent calls will not be executed
		// memory: store all the results
		flags = (flags + '' === flags) 
			? flags.split(' ') 
		    : (flags instanceof Array) 
		    	? flags
		    	: ['unique'];
		this.hasFlag = function (flag) {
			return flags.indexOf(flag) !== -1;
		};
		
		// variable used to determine what is the next priority to be assigned
		// by default to a callback, in case one was not provided
		var priority = 0;
		this.getCurrentPriority = function() {
			return priority++;
		};
		
		// registry of all the callbacks
		this._registry = [];
		// method to check if the callback is already in the registry
		this.contains = function(func) {
			var len = this._registry.length, i=len;
			while (i--) {
				if (this._registry[i]['callback'] === func) {
					return true;
				}
			}
			return false;
		};
		return this;
	};
	// callbacks prototype
	var CP = Callbacks.prototype;

	/**
	 * Add a function to the callback list
	 * 
	 * @param func 			function to be executed
	 * @param context		context enfored for the function
	 * @param priority		order in which the callbacks are added to the stack (lower means they will be executed first)
	 * @returns self
	 */
	CP.add = function(func, context, priority) {
		priority = priority || this.getCurrentPriority();
		var entry = {
			callback: func,
			context: context,
			priority: priority
		};
		if (!this.hasFlag('unique') || !this.contains(func)) { 
			this._registry.push(entry);
			__updateCallbacksOrder.call(this);
		}
		// if the callbacks stack is to be executed once and it already ran, execute the callback now
		if (this.hasFlag('once') && __hasOwnProperty.call(this, '_lastResult')) {
			this._lastResult = __executeCallback(entry, null, this._lastContext);
			if (this.hasFlag('memory')) {
				this._results = this._results || [];
				this._results.push(this._lastResult);
			}
		}
		return this;
	};

	/**
	 * Remove a function from the executution stack
	 * 
	 * @param func			function to be removed
	 * @returns self
	 */
	CP.remove = function(func) {
		var len = this._registry.length, i=len;
		while (i--) {
			if (this._registry[i]['callback'] === func) {
				this._registry.splice(i, 1);
			}
		}
		return this;
	};

	/**
	 * Executes the currently existing stack
	 * 
	 * @params				arguments passed to the callback functions
	 * @return				the result of the last callback
	 */
	CP.fire = function() {
		var args = [].slice.call(arguments);
		args.unshift(null);
		return this.fireWith.apply(this, args);
	};
	
	/**
	 * Executes the currently existing stack withing a certain context
	 * 
	 * @param context		context in which the callback functions are executed
	 * @returns			the result of the last callback
	 */
	CP.fireWith = function(context) {
		var data = [].slice.call(arguments, 1, arguments.length);
		if (this.hasFlag('once') && __hasOwnProperty.call(this, '_lastResult')) {
			return this._lastResult;
		}
		var _results = [];
		// keep the last called context for 'once' type of callbacks
		this._lastContext = context;
		var len = this._registry.length, i = len;
		while (i--) {
			try {
				// i goes from len to 0 but the callbacks should be executed from zero to len
				// so we revert the index
				_results.push(__executeCallback(this._registry[len - i - 1], data, context));
			} catch (e) {
				if (e instanceof CallbacksBreakExecutionException) {
					break;
				}
				throw e;
			}
		}
		if (this.hasFlag('memory')) {
			this._results = _results;
		}
		this._lastResult = _results[_results.length - 1];
		return this._lastResult;
	};
})(window);