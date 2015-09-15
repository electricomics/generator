(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Electricomics
 * https://github.com/electricomics
 *
/*    
@licstart  The following is the entire license notice for the 
JavaScript below.

Copyright (C) 2015  Electricomics CIC

The JavaScript code in this page is free software: you can
redistribute it and/or modify it under the terms of the GNU
General Public License (GNU GPL) as published by the Free Software
Foundation, either version 3 of the License, or (at your option)
any later version.  The code is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

As additional permission under GNU GPL version 3 section 7, you
may distribute non-source (e.g., minimized or compacted) forms of
that code without the copy of the GNU GPL normally required by
section 4, provided you include this license notice and a URL
through which recipients can access the Corresponding Source.   


@licend  The above is the entire license notice
for the JavaScript code in this page.
*/

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var inherits = require('inherits');

var steps = require('./dom/steps');
var actions = require('./dom/actions');
var history = require('./dom/history');

var PageEvent = require('./events/page');

/*
 * Constructor for the Electricomics object initialises
 * the page but does nothing
 *
 * There is no current step set as the page is only initialised
 * and not yet being played.
 */

function Electricomics (options) {
  options = options || {};

  // initialise emitter via superconstructor with options
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: '::'
  });

  // a 'step' in an incremental point where a new action should
  // occur within the context of a page
  Object.defineProperty(this, 'steps', {
    get: steps.get
  });

  // bind event listener to handle steps when using
  // the browser back button
  window.addEventListener('popstate', function (e) {
    if (e.state) {
      this.step(e.state.id);
    }
  }.bind(this));

  return this;
}

inherits(Electricomics, EventEmitter2);

Electricomics.prototype.getHistory = function () {
  return history.getHistory();
};

Electricomics.prototype.getFuture = function () {
  return history.getFuture();
};

Electricomics.prototype.clearAllHistory = function () {
  return history.clear();
};


Electricomics.prototype.addSteps = function (toCreate) {
  if (Array.isArray(toCreate)) {
    // @TODO: would be nice to write this as a
    // DocumentFragment in future
    toCreate.forEach(steps.generate);
  }
  else if (toCreate instanceof Object) {
    steps.generate(toCreate);
  }
  else {
    throw new Error('Invalid data for a new step.');
  }

  return steps.get();
};

/*
 * Start the electricomic page at the supplied step
 * If no step is provided start at the first step (step 0)
 */

Electricomics.prototype.start = function (step) {
  var firstStep = step ? step : 0;

  if (location.hash.length !== 0) {
    firstStep = location.hash.split('/')[2];
  }

  // @TODO: is there a better way to express this? Doing
  // if (!this.position) causes false positives with 0
  if (typeof this.position !== 'undefined') {
    // throw new Error('No need to play, page already started.');
    return false;
  }

  step = this.step(firstStep);

  history.start(step);

  return step;
};

/*
 * Change the current position and
 */

Electricomics.prototype.step = function (step) {
  var currentStep;

  // check to make sure we have a step already
  if (typeof this.position !== 'undefined') {
    currentStep = this.steps[this.position];
  }

  if (typeof step === 'string') {
    var newPosition = steps.findIndexById.apply(this, arguments);

    if (newPosition === this.position) {
      // throw new Error('Already at this position.');
      return;
    }
    else if (typeof newPosition !== 'undefined') {
      this.position = newPosition;
    }
    else {
      throw new Error('You must provide a valid step ID.');
    }
  }
  else {
    if (step === this.position) {
      throw new Error('Already at this position.');
    }
    else if (step >= 0 && step < this.steps.length) {
      this.position = step;
    }
    else {
      throw new Error('No step exists at the supplied position.');
    }
  }

  var nextStep = this.steps[this.position];
  actions.trigger.call(this, nextStep);

  this.emit(
    'page::step-change',
    new PageEvent(nextStep, currentStep)
  );

  return nextStep;
};

/*
 * Get the current step object, or a step with a specific ID
 * or position if supplied as an argument
 */

Electricomics.prototype.getStep = function (position) {
  // @TODO: should this take variadic args to retrieve
  // an array of steps?
  if (arguments.length === 0) {
    return this.steps[this.position];
  }
  else if (typeof position === 'string') {
    var i = steps.findIndexById.apply(this, arguments);
    return this.steps[i];
  }
  else {
    return this.steps[position];
  }
};

Electricomics.prototype.getStepId = function(position) {
  return this.getStep(position).id || false;
};

/*
 * Navigate to a particular step and add it to history
 */

Electricomics.prototype.goToStep = function (identifier) {
  var step = this.step(identifier);

  // just add this step to history
  history.add(step);

  return step;
};

Electricomics.prototype.getNextStepId = function () {
  var step;

  if (typeof this.position === 'undefined') {
    return false;
  }

  if (this.steps[this.position].next) {
    step = this.steps[this.position].next;
  }
  else if ((this.position + 1) < this.steps.length) {
    step = this.position + 1;
  }
  else {
    return false;
  }
  if (typeof step === 'number') {
    step = this.steps[step].id;
  }

  return step;
};

Electricomics.prototype.getPrevStepId = function () {
  var step;

  step = history.getPrev();
  
  if (step === false) {
    if (typeof this.position === 'undefined') {
      return false;
    }

    if (this.steps[this.position].previous) {
      step = this.steps[this.position].previous;
    }
    else if ((this.position - 1) >= 0) {
      step = this.position - 1;
    }
    else {
      return false;
    }
    if (typeof step === 'number') {
      step = this.steps[step].id;
    }
  }

  return step;
};

/*
 * Navigate to the next step as defined by the data-next property
 * If there is no data-next then go to the next in the steps array
 */

Electricomics.prototype.nextStep = function () {
  var step;

  if (typeof this.position === 'undefined') {
    // throw new Error('Can\'t call nextStep() before start()');
    return false;
  }

  if (this.steps[this.position].next) {
    step = this.goToStep(this.steps[this.position].next);
  }
  else if ((this.position + 1) < this.steps.length) {
    step = this.goToStep(this.position + 1);
  }
  else {
    // throw new Error('No more steps in this sequence.');
    return false;
  }

  return step;
};

/*
 * Navigate to the previous step as defined by the data-prev property
 * If there is no data-prev then go to the previous in the steps array
 */

Electricomics.prototype.prevStep = function () {
  var step;

  if (typeof this.position === 'undefined') {
    // throw new Error('Can\'t call prevStep() before start()');
    return false;
  }

  if (this.steps[this.position].previous) {
    step = this.goToStep(this.steps[this.position].previous);
  }
  else if ((this.position - 1) >= 0) {
    step = this.goToStep(this.position - 1);
  }
  else {
    // throw new Error('No more steps in this sequence.');
    return false;
  }

  return step;
};

/*
 * Navigate to the back step in history
 * Need to check if the step is the first as we don't want to exit the story
 * @param {function} callback - Function to call when the history changes
 */

Electricomics.prototype.back = function (callback) {
  if (typeof this.position === 'undefined') {
    // throw new Error('Can\'t call back() before start()');
    return false;
  }
  if (this.position === 0) {
    // throw new Error('No more steps in this sequence.');
    return false;
  }

  var prev = history.getPrev();
  // TODO to fix
  var step;
  if (!prev) {
    prev = this.getPrevStepId();
    step = this.step(prev);
    history.createFuture(prev);
  }
  else {
    history.back();
  }
  var identifier = history.getCurrent();

  if (callback) {
    function qwerty() {
      callback();
      window.removeEventListener('popstate', qwerty);
    }
    window.addEventListener('popstate', qwerty);
  }

  step = this.step(identifier);
  return step;
};

/*
 * Navigate to the forward step in history
 * No need to check if there is a forward step, as in that case the browser will just do nothing
 * @param {function} callback - Function to call when the history changes
 */

Electricomics.prototype.forward = function (callback) {
  if (typeof this.position === 'undefined') {
    // throw new Error('Can\'t call forward() before start()');
    return false;
  }

  history.forward();
  var identifier = history.getCurrent();

  if (callback) {
    window.addEventListener('popstate', callback);
  }

  var step = this.step(identifier);
  return step;
};

if (typeof exports === 'object') {
  // CommonJS
  module.exports = Electricomics;
}

window.Electricomics = Electricomics;

},{"./dom/actions":5,"./dom/history":6,"./dom/steps":7,"./events/page":8,"eventemitter2":2,"inherits":4}],2:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],3:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
function trigger (step) {
  var actions = step.images.map(function (img) {
    return img.dataset.action;
  });

  actions.forEach(function (action, i) {
    if (action) {
      this.emit('action::' + action, step.images[i]);
    }
  }, this);
}

module.exports = {
  trigger: trigger
};
},{}],6:[function(require,module,exports){
/*
 * Constructor for the Electricomics object initialises
 * the page but does nothing
 *
 * There is no current step set as the page is only initialised
 * and not yet being played.
 */
var _history = [];
var _future = [];
module.exports = {
  add: function (obj) {
    var ref = { id: obj.id };
    history.pushState(ref, '', '#/step/' + ref.id.toString());
    _future = [];
    _history.push(ref.id.toString());
  },
  start: function (obj) {
    var ref = { id: obj.id };
    history.replaceState(ref, '', '#/step/' + ref.id.toString());
    _history = [];
    _future = [];
    _history.push(ref.id.toString());
  },
  createFuture: function(current) {
    var ref = { id: current };
    var item = _history.pop();
    _future.unshift(item);
    history.pushState(ref, '', '#/step/' + ref.id.toString());
    _history.push(current);
  },
  getIndex: function (n) {
    var item;
    if (isNaN(n)) {
      return false;
    }
    if (n <= 0) {
      item = _history[ _history.length - 1 + n ];
    }
    else {
      item = _future[n - 1];
    }
    if (typeof item === 'undefined') {
      item = false;
    }
    return item;
  },
  go: function (n) {
    var item;
    if (this.getIndex(n) === false) {
      return false;
    }
    if (n === 0) {
      item = _history[ _history.length - 1 ];
    }
    else if (n < 0) {
      item = _history.splice(n, -n);
      _future = [].concat(item, _future);
    }
    else {
      item = _future.splice(0, n);
      _history = _history.concat(item);
    }
    history.go(n);
    return item;
  },
  back: function () {
    return this.go(-1);
  },
  forward: function () {
    return this.go(1);
  },
  getCurrent: function() {
    return this.getIndex(0);
  },
  getPrev: function () {
    return this.getIndex(-1);
  },
  getNext: function () {
    return this.getIndex(1);
  },
  getHistory: function () {
    return _history;
  },
  getFuture: function () {
    return _future;
  },
  clearHistory: function () {
    _history = [];
  },
  clearFuture: function () {
    _future = [];
  },
  clear: function () {
    this.clearHistory();
    this.clearFuture();
  }
}

},{}],7:[function(require,module,exports){
var extend = require('extend');

function Step () {
  // this function, for now, is no-op that just creates
  // a nice 'Step' object that can be returned by getSteps
}

function getSteps () {
  // we need to convert NodeList into an array so we can
  // iterate over it
  var nodes = [].slice.call(document.querySelectorAll('.step'));

  if (nodes.length === 0) {
    throw new Error('There needs to be at least one element in the document with a class name of ".step"');
  }

  return nodes.map(function (el) {
    var step = new Step();

    extend(step, el.dataset);

    step.images = [].slice.call(el.children);
    step.node = el;
    step.id = el.id;

    return step;
  });
}

function generateStep (step) {
  var el = document.createElement('section');

  // @TODO: add checks for correct properties
  el.className = 'step';
  el.id = step.id || '';

  Object.keys(step).forEach(function (attr) {
    if (attr !== 'id') {
      el.dataset[attr] = step[attr];
    }
  });

  document.body.appendChild(el);
}

/*
 * Return the index of a step given it's id
 */

function findIndexById (id) {
  // @TODO: Cleaner once Safari 8 arrives and has support for
  // Array.prototype.findindex()

  var result = null;

  this.steps.some(function (el, i) {
    if (el.id === id) {
      result = i;
      return true;
    }
  });

  return result;
};

module.exports = {
  get: getSteps,
  generate: generateStep,
  findIndexById: findIndexById
};
},{"extend":3}],8:[function(require,module,exports){
var inherits = require('inherits');

function PageEvent (stepTo, stepFrom) {
  // this is the default event type
  this.type = 'action';

  if (stepTo && stepFrom) {
    this.type = 'transition';
    this.to = stepTo;
    this.from = stepFrom;
  }
  else if (stepTo) {
    this.type = 'start';
    this.from = stepTo;
  }
}

module.exports = PageEvent;

},{"inherits":4}]},{},[1])


