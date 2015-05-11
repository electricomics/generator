/* global $, Electricomics, Hammer */
document.ontouchmove = function(event){
  event.preventDefault();
};

var something = function(comic, options) {
  var defaults = {
    width: 1024,
    height: 768,
    transitionIn: 'fade',
    transitionOut: 'fade'
  };
  // extend default options with those provided
  var opts = $.extend(defaults, options);

  var that = this;
  
  var $comic = $('#comic');
  var $currentEl;
  var comicWidth;
  var comicHeight;

  var disableTap = false;
  
  var mc = new Hammer.Manager($comic.get(0));
  // mc.add(new Hammer.Press({ event: 'restartComic', time: 2000 }));
  mc.add(new Hammer.Tap({ event: 'singletap', threshold: 2, pointers: 1, taps: 1 }));

  this.resizeLayout = function() {
    var screenWidth = document.documentElement.clientWidth;
    var screenHeight = document.documentElement.clientHeight;

    comicWidth = screenWidth;
    comicHeight = comicWidth / opts.width * opts.height;
    if (comicHeight > screenHeight) {
      comicHeight = screenHeight;
      comicWidth = comicHeight / opts.height * opts.width;
    }
    $comic
      .css('width', comicWidth)
      .css('height', comicHeight);
  };

  var getCurrentEl = function() {
    var $el = $(comic.getStep().node);
    if ($el.length) {
      $currentEl = $el;
    }
    else {
      $currentEl = false;
    }
  };

  var isTap = function($el) {
    var tap = $el.data('tap');
    if (typeof tap === 'undefined') {
      var $par = $el.closest('[data-tap]');
      if ($par.length > 0) {
        return !!$par.data('tap');
      }
      return true;
    }
    else {
      return !!tap;
    }
  };

  this.restartComic = function() {
    if (disableTap) {
      return false;
    }
    
    var firstId = nav.firstId();
    if ($currentEl.attr('id') === firstId) {
      return false;
    }
    
    navToStep('first');
    $('.step').promise().done(function() {
      // refresh the page to reset the style applied by previous navigation
      location.reload();
    });
  };

  var singleTap = function(e) {
    if (disableTap) {
      return false;
    }
    var $el = $(e.target);
    if (!isTap($el)) {
      return false;
    }
    var x = e.pointers[0].offsetX;
    var half = opts.width / 2;
    if (x < half) {
      navToStep('prev');
    }
    else {
      navToStep('next');
    }
  };

  var init = function() {
    // this.resizeLayout();
    loadStep();
  };


  // after/before functions
  this.doNothing = function() {
    return false;
  };


  var hideOthers = function() {
    var $visibles = $('.step').not(':hidden').not($currentEl);
    if ($visibles.length > 0) {
      $visibles.hide();
    }
  };

  var hide = function() {
    var transitionOut = $currentEl.data('transition-out') || opts.transitionOut;
    hideOthers();
    if (transitionOut === 'fade') {
      return $currentEl.fadeOut();
    }
    else {
      return $currentEl.hide();
    }
  };
  var show = function() {
    var transitionIn = $currentEl.data('transition-in') || opts.transitionIn;
    if (transitionIn === 'fade') {
      return $currentEl.fadeIn();
    }
    else {
      return $currentEl.show();
    }
  };
  var nav = {
    next: function() {
      comic.nextStep();
    },
    prev: function() {
      comic.prevStep();
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
      return comic.getStepId(id);
    }
  };

  var unloadStep = function() {
    var beforeHide = $currentEl.data('before-hide') || 'doNothing';
    var afterHide = $currentEl.data('after-hide') || 'doNothing';

    return $.when( that[beforeHide]($currentEl) )
      .done(function() {
        return $.when( hide() )
          .done(function() {
            that[afterHide]($currentEl);
          });
      });
  };

  var loadStep = function() {
    getCurrentEl();
    if ($currentEl === false) {
      return false;
    }

    var beforeShow = $currentEl.data('before-show') || 'doNothing';
    var afterShow = $currentEl.data('after-show') || 'doNothing';

    return $.when( that[beforeShow]($currentEl) )
      .done(function() {
        return $.when( show() )
          .done(function() {
            that[afterShow]($currentEl);
          });
      });
  };

  var navToStep = function(dir, id) {
    var step = nav[dir + 'Id'](id);
    if (step === false) {
      disableTap = false;
      return false;
    }
    disableTap = true;

    var beforeHide = $currentEl.data('before-hide') || 'doNothing';
    var afterHide = $currentEl.data('after-hide') || 'doNothing';
    return $.when( that[beforeHide]($currentEl) )
      .done(function() {
        return $.when( hide() )
          .done(function() {
            return $.when( that[afterHide]($currentEl) )
              .done(function() {
                nav[dir](id);
                getCurrentEl();
                if ($currentEl === false) {
                  disableTap = false;
                  return false;
                }
                var beforeShow = $currentEl.data('before-show') || 'doNothing';
                var afterShow = $currentEl.data('after-show') || 'doNothing';
                return $.when( that[beforeShow]($currentEl) )
                  .done(function() {
                    return $.when( show() )
                      .done(function() {
                        return $.when( that[afterShow]($currentEl) )
                          .done(function() {
                            disableTap = false;
                          });
                      });
                  });
              });
          });
      });
  };

  mc.on('singletap', singleTap);
  // mc.on('restartComic', that.restartComic);

  init();

  return this;
};


var comic;
var a;
window.onload = function() {
  comic = new Electricomics();
  comic.start();
  a = something(comic, comicJSON);
  $('ec-curtains').fadeOut();
};
// window.onresize = function() {
//   requestAnimationFrame(a.resizeLayout);
// };