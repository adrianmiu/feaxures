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