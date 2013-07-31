(function(root, undefined){
	var EventManager, Event;
	Event = root.Event = function(name) {
		this.toString = function() {
			return name;
		}
	}
	EventManager = root.EventManager = function(options) {
		var _clbs = {}, _clbsChildren = {};
		options = options || {flags: 'unique memory'};
		var storeChildren = function(name) {
			var parentName = '';
			if (name.lastIndexOf('.') !== -1) {
				parentName = name.substr(0, name.lastIndexOf('.'));
				_clbsChildren[parentName] = _clbsChildren[parentName] || [];
				(_clbsChildren[parentName].indexOf(name) !== -1) ||_clbsChildren[parentName].push(name);
				storeChildren(parentName);
			}
		}
		var getCallbacks = function(name) {
			if (!_clbs[name]) {
				_clbs[name] = new Callbacks(options.flags || 'unique memory');
				storeChildren(name);
			}
			return _clbs[name];
		}
		this.on = function(name, func, context, priority) {
			getCallbacks(name).add(func, context, priority);
			return this;
		}
		this.off = function(name, func, context, priority) {
			getCallbacks(name).remove(func, context, priority);
			return this;
		}
		this.one = function(name, func, context, priority) {
			var self = this,
				onceFunc = function() {
					func.apply(self, [].slice.call(arguments));
					getCallbacks(name).remove(onceFunc);
				}
			getCallbacks(name).add(onceFunc, context, priority);
			return this;
		}
		this.trigger = function(name, data) {
			var evt,	// event object
				result,	// result of the callback execution
				clbs;	// callbacks object
			evt = name instanceof Event ? name : new Event(name);
			name = name instanceof Event ? name.toString() : name;
			clbs = getCallbacks(name);
			result = clbs.fireWith(this, evt, data);
			evt.results = clbs._results;
			evt.lastResult = clbs._lastResult;
			var childEvents = _clbsChildren[name];
			if (childEvents && childEvents.length) {
				for (var i=0, len = childEvents.length; i < len; i++) {
					var childEvt = this.trigger(childEvents[i]);
					[].push.apply(evt.results, childEvt.results);
					evt.lastResult = childEvt.lastResult;
				}
			}
			return evt;
		}
	}
})(window);