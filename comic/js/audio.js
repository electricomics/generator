/* global Howler, Howl */

(function() {
  'use strict';

  /*
   * Detects the audio element - taken from Modernizr
   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
   */
  function testAudio () {
    var elem = document.createElement('audio');
    var bool = false;

    try {
      if (bool = !!elem.canPlayType) {
        bool      = new Boolean(bool);
        bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
        bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/, '');
        bool.opus = elem.canPlayType('audio/ogg; codecs="opus"')  .replace(/^no$/, '');

        // Mimetypes accepted:
        //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
        //   bit.ly/iphoneoscodecs
        bool.wav  =  elem.canPlayType('audio/wav; codecs="1"')    .replace(/^no$/, '');
        bool.m4a  = (elem.canPlayType('audio/x-m4a;')             ||
                     elem.canPlayType('audio/aac;'))              .replace(/^no$/, '');
      }
    } catch (e) { }

    return bool;
  }

  var isAudioSupported = testAudio();


  function loadAudio (el) {
    el.autoplay = false;
    return new Howl({
      autoplay: el.autoplay,
      src: [el.currentSrc]
    });
  }

  function loadMetadata (el, volume) {
    return {
      loop: el.getAttribute('loop') == null ? false : true,
      volume: el.getAttribute('volume') == null ? volume : (el.getAttribute('volume') * 1)
    };
  }
  

  function Melodist (options) {
    var opts = options || {};
    var comic = opts.comic;
    var callback = opts.callback;
    
    var muted = false;
    var volume = 1;
    var step = 0.1;

    function init (comic, callback) {
      var steps = comic.steps;
      var audio = {};
      var audioSeek = {};
      var audioSteps = {};
      var a;
      var counter = 0;
      for (var i = 0; i < steps.length; i++) {
        a = steps[i].node.querySelectorAll('audio');
        audioSteps[steps[i].id] = {};
        for (var m = 0; m < a.length; m++) {
          audioSteps[steps[i].id][ a[m].currentSrc ] = loadMetadata(a[m], volume);
          if (audio[ a[m].currentSrc ] == null) {
            counter++;
            audio[ a[m].currentSrc ] = loadAudio(a[m]);
            audio[ a[m].currentSrc ].once('load', function() {
              counter--;
              console.log('ok', this._src);
              if (counter === 0) {
                callback();
              }
            });
            audio[ a[m].currentSrc ].once('loaderror', function() {
              counter--;
              console.log('e', this._src);
              if (counter === 0) {
                callback();
              }
            });
          }
        }
      }
      
      comic.on('page::step-change', function(e) {
        var from = audioSteps[e.from.id];
        if (e.type === 'transition') {
          var to = audioSteps[e.to.id];
          for (var prop in from) {
            if (from.hasOwnProperty(prop)) {
              if (audioSeek[prop] == null) {
                audioSeek[prop] = 0;
              }
              audio[prop].pause();
              audioSeek[prop] += audio[prop].seek();
            }
          }
          for (var prop2 in to) {
            if (to.hasOwnProperty(prop2)) {
              audio[prop2].volume( to[prop2].volume );
              audio[prop2].play();
              if (audioSeek[prop2] != null) {
                audio[prop2].seek(audioSeek[prop2]);
              }
              audio[prop2].once('play', (function(wot) {
                return function(e) {
                  console.log(this._src, wot);
                  this.loop(wot);
                };
              }) (to[prop2].loop) );
            }
          }
        }
        if (e.type === 'start') {
          for (var prop3 in from) {
            if ((from).hasOwnProperty(prop3)) {
              audio[prop3].volume( from[prop3].volume );
              audio[prop3].play();
              audio[prop3].once('play', (function(wot) {
                return function(e) {
                  console.log(this._src, wot);
                  this.loop(wot);
                };
              }) (from[prop3].loop) );
            }
          }
        }
      });
    }

    init(comic, callback);

    var mute = function() {
      muted = !muted;
      Howler.mute(muted);
      return muted;
    };

    this.mute = function() {
      mute();
    };

    this.volumeUp = function() {
      volume += step;
      muted = false;
      Howler.volume(volume);
      return volume;
    };

    this.volumeDown = function() {
      volume -= step;
      muted = false;
      Howler.volume(volume);
      return volume;
    };

    document.addEventListener('elcx:toggleAudio', function () {
      return mute();
    }, false);
    // document.dispatchEvent(new Event('elcx:toggleAudio'));

    return this;
  }


  window.isAudioSupported = isAudioSupported;
  window.Melodist = Melodist;
}());