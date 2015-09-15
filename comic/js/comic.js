/* global $, Electricomics, Hammer, Storage */

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
var CreateDigitalComic = function(options) {
  var defaults = {
    animate: 'animate',
    duration: 1000,
    storage: false,
    audio: false,
    volume: 1,
    zoom: false,
    id: 'electricomic',
    width: 1024,
    height: 768,
    transitionIn: 'fade',
    transitionOut: 'fade',
    beforeShow: '',
    beforeHide: '',
    afterShow: '',
    afterHide: '',
    show: 'show',
    hide: 'hide'
  };
  // extend default options with those provided
  var opts = $.extend(defaults, options);

  var comic = new Electricomics();
  var $comic = $('#comic');
  var $curtains = $('ec-curtains');
  
  var duration = opts.duration;
  
  var screenWidth;
  var screenHeight;
  var comicWidth;
  var comicHeight;

  var $currentEl;
  var $nextEl;
  var $prevEl;

  var calcSizes = function() {
    screenWidth = document.documentElement.clientWidth;
    screenHeight = document.documentElement.clientHeight;
    comicWidth = screenWidth;
    comicHeight = comicWidth / opts.width * opts.height;
    if (comicHeight > screenHeight) {
      comicHeight = screenHeight;
      comicWidth = comicHeight / opts.height * opts.width;
    }
  };

  // find elements
  var getCurrentEl = function() {
    var $el = $(comic.getStep().node);
    if ($el.length) {
      $currentEl = $el;
    }
    else {
      $currentEl = false;
    }
  };
  var getNextEl = function() {
    var $el = $('#' + comic.getNextStepId());
    if ($el.length) {
      $nextEl = $el;
    }
    else {
      $nextEl = false;
    }
  };
  var getPrevEl = function() {
    var $el = $('#' + comic.getPrevStepId());
    if ($el.length) {
      $prevEl = $el;
    }
    else {
      $prevEl = false;
    }
  };

  var stepActions = {};

  stepActions.doNothing = function() {
    return false;
  };

  stepActions.hide = function(doIt, transition) {
    if (doIt === false) {
      return false;
    }
    var transitionOut = transition || $currentEl.data('transition-out') || opts.transitionOut;
    if (transitionOut === 'fade') {
      return $currentEl.fadeOut();
    }
    if (transitionOut === 'normal') {
      $currentEl.removeClass('show');
      return $currentEl.hide();
    }
    if (transitionOut === 'scroll') {
      return false;
    }
  };
  stepActions.show = function(doIt, transition) {
    if (doIt === false) {
      return false;
    }
    var transitionIn = transition || $currentEl.data('transition-in') || opts.transitionIn;
    if (transitionIn === 'fade') {
      return $currentEl.fadeIn();
    }
    if (transitionIn === 'normal') {
      $currentEl.addClass('show');
      return $currentEl.show();
    }
    if (transitionIn === 'scroll') {
      var res = $currentEl.offset().top - ((document.documentElement.clientHeight - $currentEl.height()) / 2);
      return $('html, body').animate({
        scrollTop: res
      }, duration);
    }
  };

  var nav = {
    next: function() {
      comic.nextStep();
    },
    prev: function() {
      comic.back();
    },
    goto: function(id) {
      comic.goToStep(id);
    },
    first: function() {
      comic.goToStep(0);
    },
    nextId: function() {
      return comic.getNextStepId();
    },
    prevId: function() {
      return comic.getPrevStepId();
    },
    firstId: function() {
      return comic.getStepId(0);
    },
    gotoId: function(id) {
      return id;
    }
  };

  var loadStep = function(dir, doShowIt, finalCallback, loadActions) {
    getCurrentEl();
    if ($currentEl === false) {
      return false;
    }
    var actions = $.extend({}, loadActions);
    var beforeShow = actions.beforeShow || $currentEl.data('before-show') || opts.beforeShow || 'doNothing';
    var afterShow = actions.afterShow || $currentEl.data('after-show') || opts.afterShow || 'doNothing';
    var show = actions.show || $currentEl.data('show') || opts.show || 'doNothing';
    return $.when( stepActions[beforeShow](dir) )
      .done(function() {
        return $.when( stepActions[show](doShowIt) )
          .done(function() {
            return $.when( stepActions[afterShow](dir) )
              .done(function() {
                if (finalCallback) {
                  finalCallback();
                }
              });
          });
      });
  };

  var unloadStep = function(dir, doHideIt, finalCallback, unloadActions) {
    var actions = $.extend({}, unloadActions);
    var beforeHide = actions.beforeHide || $currentEl.data('before-hide') || opts.beforeHide || 'doNothing';
    var afterHide = actions.afterHide || $currentEl.data('after-hide') || opts.afterHide || 'doNothing';
    var hide = actions.hide || $currentEl.data('hide') || opts.hide || 'doNothing';
    return $.when( stepActions[beforeHide](dir) )
      .done(function() {
        return $.when( stepActions[hide](doHideIt) )
          .done(function() {
            return $.when( stepActions[afterHide](dir) )
              .done(function() {
                if (finalCallback) {
                  finalCallback();
                }
              });
          });
      });
  };

  var navToStep = function(dir, id, doHideIt, doShowIt, finalCallback, navActions) {
    var stepId = nav[dir + 'Id'](id);
    var actions = $.extend({}, navActions);
    if (stepId === false) {
      return false;
    }
    if ($currentEl.attr('id') === stepId) {
      return false;
    }
    return unloadStep(dir, doHideIt, function() {
      nav[dir](id);
      return loadStep(dir, doShowIt, finalCallback, actions);
    }, actions);
  };

  var init = function() {
    var fx = function() {
      loadStep(null, null, function() {
        $curtains.hide();
        initHammer();
      });
    };
    var $curtainsStart = $curtains.find('.start');
    if ($curtainsStart.length === 0) {
      fx();
    }
    else {
      $curtains
        .addClass('loaded')
        .one('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          fx();
        });
    }
  };

  // resize view
  this.resize = function() {
    calcSizes();
    
    $comic.css({
      height: comicHeight,
      width: comicWidth
    });
  };

  this.start = function() {
    var firstStep = 0;
    if (opts.storage === true) {
      this.storage = initStorage();
      firstStep = this.storage.getItem('currentStep');
    }
    comic.start(firstStep);
    this.resize();
    init();
  };

  // restart from first step and delete history
  this.home = function() {
    $curtains.fadeIn(function() {
      if (nav.firstId() !== $currentEl.attr('id')) {
        comic.clearAllHistory();
        navToStep('first');
      }
      init();
    });
  };

  // go to next step
  this.next = function() {
    navToStep('next');
  };

  // go to previous step
  this.prev = function() {
    navToStep('prev');
  };

  // Hammer
  var mc = new Hammer.Manager(document.body);
  var initHammer = function() {
    mc.add(new Hammer.Tap({ event: 'singletap', threshold: 2, pointers: 1, taps: 1 }));
    mc.on('singletap', function(e) {
      var pointer = e.pointers[0];
      var x = pointer.clientX;
      var w = document.documentElement.clientWidth / 3;
      if (x < w) {
        navToStep('prev');
      }
      else {
        navToStep('next');
      }
    });
  };

  // Storage
  var initStorage = function() {
    var storage = new Storage({namespace: opts.id});
    storage.load();
    comic.on('page::step-change', function(e) {
      if (e.type === 'transition') {
        storage.setItem('currentStep', e.to.id);
      }
      if (e.type === 'start') {
        storage.setItem('currentStep', e.from.id);
      }
    });
    return storage;
  };

  // Zoom and touch events
  if (opts.zoom === false) {
    document.ontouchmove = function(event){
      event.preventDefault();
    };
  }

  return this;
};