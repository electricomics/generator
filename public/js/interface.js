/* global $, mousePositionElement, Electricomic, confirm, Handlebars, Blob, saveAs, isLteIE9, Storage */
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
var useLocal = false;
var useServer = true;
var useNodeWebkitServer = true;

var isFileReader = !!(window.FileReader || false);
var isFileSaver = false;
try {
  isFileSaver = !!new Blob();
} catch (e) {
  isFileSaver = false;
}
var isSavedLocalStorage = false;
try {
  isSavedLocalStorage = !!localStorage;
} catch (e) {
  isSavedLocalStorage = false;
}

var isSavedRemote = true;

// prevent backspace key from navigating back
// $(document).on('keydown', function(e) {
//   if (e.keyCode === 8) {
//     e.preventDefault();
//     return false;
//   }
// });

var $artboard = $('#artboard');
var artboard = $artboard.get(0);
var $pagesNav = $('#pages-nav');
var $panelsNav = $('#panels-nav');
var $comicName = $('#comic-name');
var $comicOrientation = $('#comic-orientation');
var $comicPxRatio2 = $('#comic-pxratio-2');
var $comicWidth = $('#comic-width');
var $comicHeight = $('#comic-height');
var $comicCreatorLine = $('.comic-creator-line').clone();
var $comicSummary = $('#comic-summary');
var $comicVersion = $('#comic-version');
var $comicDate = $('#comic-date');
var $panelTemplate = $($('#panel-template').html());
var $pageTemplate = $($('#page-template').html());
// var $exportTemplate = $('#export-template').html();
var templateFiles = ['index.html.hbs', 'comic.json.hbs'];
var templateFilesContent = {};
// var $preview = $('#preview');
// var $previewOverlay = $('#preview-overlay');
var $textareaOutput = $('#textarea-output');
var $textareaOutputOverlay = $('#textarea-output-overlay');
var $textareaInput = $('#textarea-input');
// var $textareaInputOverlay = $('#textarea-input-overlay');
var $textareaInputButton = $('#textarea-input-button');
var CURRENT_PAGE = 1;
var LOCAL_STORAGE = 'electricomic';


/* --- Conditional Code for NodeWebkitServer --- */

if (useNodeWebkitServer) {
  if (window.location.search !== '') {
    var searchParams = (function() {
        var searchParams = {};
        var searchArr = window.location.search.substring(1).split('&');
        var tmp;
        for (var i = 0; i < searchArr.length; i++) {
          tmp = searchArr[i].split('=');
          searchParams[ tmp[0] ] = tmp[1];
        }
        return searchParams;
      })();
  
    LOCAL_STORAGE = searchParams.id || LOCAL_STORAGE;
  }
}

if (useNodeWebkitServer) {
  (function() {
    for (var i = 0; i < templateFiles.length; i++) {
      (function(file) {
        $.ajax({
          url: 'templates/' + file,
          dataType: 'text',
          success: function(data) {
            templateFilesContent[ file ] = data;
          }
        });
      })(templateFiles[i]);
    }
  })();
}

/* --- END Conditional Code for NodeWebkitServer --- */


if (typeof isLteIE9 !== 'undefined' && isLteIE9) {
  var filereaderSWFopt = {
    filereader: 'js/lib/FileReader/filereader.swf'
  };
  $('input[type="file"').fileReader(filereaderSWFopt);
}

var ID = function() {
  return '_' + Math.random().toString(36).substr(2, 9);
};


/* --- Local Storage Code --- */

var storage = new Storage(LOCAL_STORAGE);

var saveLocalStorage = function() {
  var val = myComic.returnJSON();
  var isSaved = storage.save(val);
  isSavedLocalStorage = false;
  if (isSaved) {
    isSavedLocalStorage = true;

    if (useNodeWebkitServer) {
      if (isSavedRemote) {
        isSavedRemote = false;
        window.parent.postMessage('{"type": "changed", "iframe": "' + LOCAL_STORAGE + '", "status": ' + isSavedRemote + '}', '*');
      }
    }
  }
};

// var clearLocalStorage = function() {
//   storage.clear();
// };

/* --- END Local Storage Code --- */


/* --- Conditional Code for FileReader --- */

if (isFileReader) {
  var handleFileSelect = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var pos = mousePositionElement(e);

    var files = e.dataTransfer.files; // FileList object.
    var file;

    // files is a FileList of File objects. List some properties.
    for (var i = 0; i < files.length; i++) {
      file = files[i];
      addImg(file, pos);
    }
  };

  var handleDragOver = function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  };

  // Tells the browser that we *can* drop on this target
  artboard.addEventListener('dragover', handleDragOver, false);
  artboard.addEventListener('drop', handleFileSelect, false);


  var addImg = function(file, pos) {
    // Only process image files.
    if (!file.type.match('image.*')) {
      return;
    }
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('loadend', function(e) {

      var imgFile = {
        src: e.target.result,
        name: file.name
      };
      addImgFile(imgFile, pos);
    });
  };
}
else {
  // TODO: fallback for FileReader
}
/* --- END Conditional Code for FileReader --- */


/* --- Image related functions --- */

var realSizeImg = function($el) {
  /* MM: calling the function from imgLoaded need to pass directly the image not the containing div */
  if ($el.get(0).nodeName === "IMG") {
    var realImg = $el.get(0);
  }
  else {
    var realImg = $el.find('img').get(0);
  } 
  var w = realImg.naturalWidth;
  var h = realImg.naturalHeight;
  console.log('realSizeImg. naturalWidth: '+w+', naturalHeight: '+h+', realImg', realImg)
  return {
    w: w,
    h: h
  };
};

var showResize = function(panelId) {
  var $panelWrapper = $('#panel' + panelId);
  var $resized = $panelWrapper.find('.panel-nav-resized');
  var $original = $panelWrapper.find('.panel-nav-original');
  var w = $panelWrapper.find('.panel-w').val() * 1;
  var h = $panelWrapper.find('.panel-h').val() * 1;
  var wNatural = $panelWrapper.find('.panel-w-natural').val() * 1;
  var hNatural = $panelWrapper.find('.panel-h-natural').val() * 1;
  console.log('showResize for: '+panelId+', wNatural: '+wNatural+', hNatural: '+hNatural+', w: '+w+', h: '+h);
  if (w === wNatural && h === hNatural) {
    $resized.removeClass('show-icon');
    $original.removeClass('show-icon');
  }
  else {
    $resized.addClass('show-icon');
    $original.addClass('show-icon');
  }
};

var addImgFile = function(imgFile, pos) {
  var zIndexes = getZIndexes('');
  var biggest = zIndexes.pop();
  if (biggest == null) {
    biggest = 0;
  }

  var comicData = myComic.getComic();
  var xPercent = pos.x * 100 / comicData.screenW;
  var yPercent = pos.y * 100 / comicData.screenH;

  var newImg = {
    id: ID(),
    src: imgFile.src,
    x: pos.x,
    y: pos.y,
    xPercent: xPercent,
    yPercent: yPercent,
    z: biggest + 1,
    name: imgFile.name
  };
  var $img = appendImg(newImg);

  console.log('addImgFile WRITE x: '+pos.x+', y: '+pos.y+', xPercent: '+xPercent+', yPercent: '+yPercent);

  // the code below only sets width and height for images in a saved comic
  // when adding a new image that is not loaded yet, dimensions  are undefined EDIT: actually 0 according to console.log
  // therefore this code is repeated in imgLoaded
  var w = $img.width();
  var h = $img.height();

  //if (typeof w !== "undefined" && typeof h !== "undefined") {
  if (w !== 0 && h !== 0) {

    // TODO: make it flexible for future pixel ratio
    if ($comicPxRatio2.is(':checked')) {
      w = w / 2;
      h = h / 2;
      // MM: should this CSS be % and changed in all cases regardless of ratio ?
      //$img.css('width', w + 'px');
      //$img.css('height', h + 'px');
    }

    var wPercent = w * 100 / comicData.screenW;
    var hPercent = h * 100 / comicData.screenH;

    newImg.w = w;
    newImg.h = h;
    newImg.wPercent = wPercent;
    newImg.hPercent = hPercent;

    console.log('addImgFile WRITE w: '+w+', h: '+h+', wPercent: '+wPercent+', hPercent: '+hPercent);

    // MM: should this CSS be % and changed in all cases regardless of ratio ?
    $img.css('width', wPercent + '%');
    $img.css('height', hPercent + '%');
  }

  var newPanel = myComic.addPanel(CURRENT_PAGE, newImg);
  newImg.pageN = newPanel.pageN;
  newImg.panelN = newPanel.panelN;
  addPanelForm(newImg);
  addImgEvent($img);
  saveLocalStorage();
};

var addRelativeImg = function(obj, pos) {
  var path = obj.path.replace(LOCAL_STORAGE + '/', '');
  var imgFile = {
    src: path,
    name: obj.name
  };
  addImgFile(imgFile, pos);
};

// called when a newly uploaded image is dropped on the artboard and has finished loading
// gets natural size for resize icon display and also to set initial dimensions for CSS
var imgLoaded = function(obj, $img) {
  //console.log('imgLoaded', obj, $img);
  var $div = $('#' + obj.id);
  var $panelWrapper = $('#panel' + obj.id);
  var $w = $panelWrapper.find('.panel-w');
  var $h = $panelWrapper.find('.panel-h');

  // read natural size of the image (to decide whether to show resize icons) for a new image
  // for an image from saved comic, same code happens in addImgFile, becasue natural size only exists once image is loaded.
  var realSize = realSizeImg($img);
  obj.naturalW = realSize.w;
  obj.naturalH = realSize.h;
  // this hidden input is used as reference to decide whether to show the resize icon or not in showResize
  $panelWrapper.find('.panel-w-natural').val(obj.naturalW);
  $panelWrapper.find('.panel-h-natural').val(obj.naturalH);

  // set actual width and height for a new image
  // for an image from saved comic, same code happens in addImgFile
  var w = realSize.w;
  var h = realSize.h;

  // TODO: make it flexible for future pixel ratio
  if ($comicPxRatio2.is(':checked')) {
    w = w / 2;
    h = h / 2;
  }

  var comicData = myComic.getComic();
  var wPercent = w * 100 / comicData.screenW;
  var hPercent = h * 100 / comicData.screenH;

  obj.w = w;
  obj.h = h;
  obj.wPercent = wPercent;
  obj.hPercent = hPercent;

  console.log('imgLoaded WRITE w: '+w+', h: '+h+', wPercent: '+wPercent+', hPercent: '+hPercent+', naturalW: '+obj.naturalW+', naturalH: '+obj.naturalH);
 
  // MM: should CSS be put on $div or $img ??? can no longer be both since % inside % will multiply. $img previously set in add ImgFile before dimensions existed, so probably was never set
  //$div.css('width', realSize.w + 'px');
  //$div.css('height', realSize.h + 'px');
  $div.css('width', wPercent + '%');
  $div.css('height', hPercent + '%');

  $w.val(realSize.w);
  $w.trigger('change');
  $h.val(realSize.h);
  $h.trigger('change');
  saveLocalStorage();
};

var appendImg = function(obj) {
  var $img = $('<img>');
  var $div = $('<div class="artboard-img">');
  var src = obj.src;
  if (useServer) {
    src = LOCAL_STORAGE + '/' + src;
  }

  var w = 0;
  var h = 0;
  var wPercent = 0;
  var hPercent = 0;

  $div.attr('id', obj.id);
  $img.attr('src', src);

  console.log('appendImg READ x: '+obj.x+', y: '+obj.y+', xPercent: '+obj.xPercent+', yPercent: '+obj.yPercent);
  //$div.css('left', obj.x + 'px');
  //$div.css('top', obj.y + 'px');
  $div.css('left', obj.xPercent + '%');
  $div.css('top', obj.yPercent + '%');
  $div.css('z-index', obj.z);

  $div.append($img);
  $artboard.append($div);

  // when we drop a new image on the artboard, the size is not available until the image has loaded
  // we need to append it first and then get the dimensions once the image has loaded
  if (obj.w == null || obj.h == null) {
    console.log('appendImg NULL CASE DEFINE ONLOAD')
    $img.on('load', function(e) {
      imgLoaded(obj, $(this), e);
    });
  }

  console.log('appendImg READ w: '+obj.w+', h: '+obj.h+', wPercent: '+obj.wPercent+', hPercent: '+obj.hPercent+', naturalW: '+obj.naturalW+', naturalH: '+obj.naturalH);
  // MM: I'm confused because we test for null but if image not loaded yet, console.log says the dimensions are undefined
  /*if (obj.w != null) {
    w = obj.w;
  }
  if (obj.h != null) {
    h = obj.h;
  }
  $div.css('width', w + 'px');
  $div.css('height', h + 'px');*/
  if (obj.wPercent != null && typeof obj.wPercent !== "undefined") {
    wPercent = obj.wPercent;
  }
  if (obj.hPercent != null && typeof obj.wPercent !== "undefined") {
    hPercent = obj.hPercent;
  }
  $div.css('width', wPercent + '%');
  $div.css('height', hPercent + '%');
  
  return $div;
};

var addImgEvent = function($img) {
  var id = $img.attr('id');
  var $panelWrapper = $('#panel' + id);
  var $w = $panelWrapper.find('.panel-w');
  var $h = $panelWrapper.find('.panel-h');
  var $x = $panelWrapper.find('.panel-x');
  var $y = $panelWrapper.find('.panel-y');
  // make it resizable
  $img.resizable({
    aspectRatio: true,
    handles: 'all',
    stop: function(event, ui) {
      //console.log('image resize: W: '+ui.size.width+', H: '+ ui.size.height);
      $w.val(ui.size.width);
      $w.trigger('change');
      $h.val(ui.size.height);
      $h.trigger('change');
    }
  });
  // make it draggable
  $img.draggable({
    stop: function(event, ui) {
      //console.log('image drag: left: '+ui.position.left+', top: '+ui.position.top);
      $x.val(ui.position.left);
      $x.trigger('change');
      $y.val(ui.position.top);
      $y.trigger('change');
    }
  });
};

var updateImg = function(id, what) {
  var $el = $('#' + id);
  // wrapper created by jqueryUI
  var $parEl = $el.closest('.ui-wrapper');

  // MM: now that we set sizes in %, should put the css only on one of the 2 wrappers? 
  // because % inside % will multiply won't they ??? EDIT: it looks fine, but not sure why
  // or do the % only go in the generated comic, the editor, which has the jquery UI wrapper, remains in px ???
  var comicData = myComic.getComic();

  if (what.w != null) {
    var wPercent = what.w * 100 / comicData.screenW;
    //console.log('updateImg SET CSS w: '+what.w+', wPercent: '+wPercent);
    //$el.css('width', what.w + 'px');
    //$parEl.css('width', what.w + 'px');
    $el.css('width', wPercent + '%');
    $parEl.css('width', wPercent + '%');
  }
  if (what.h != null) {
    var hPercent = what.h * 100 / comicData.screenH;
    //console.log('updateImg SET CSS h: '+what.h+', hPercent: '+hPercent);
    //$el.css('height', what.h + 'px');
    //$parEl.css('height', what.h + 'px');
    $el.css('height', hPercent + '%');
    $parEl.css('height', hPercent + '%');
  }
  if (what.x != null) {
    var xPercent = what.x * 100 / comicData.screenW;
    //console.log('updateImg SET CSS x: '+what.x+', xPercent: '+xPercent);
    //$el.css('left', what.x + 'px');
    //$parEl.css('left', what.x + 'px');
    $el.css('left', xPercent + '%');
    $parEl.css('left', xPercent + '%');
  }
  if (what.y != null) {
    var yPercent = what.y * 100 / comicData.screenH;
    //console.log('updateImg SET CSS y: '+what.y+', yPercent: '+yPercent);
    //$el.css('top', what.y + 'px');
    //$parEl.css('top', what.y + 'px');
    $el.css('top', yPercent + '%');
    $parEl.css('top', yPercent + '%');
  }
  if (what.z != null) {
    $el.css('z-index', what.z);
    $parEl.css('z-index', what.z);
  }
};

/* --- END Image related functions --- */


/* --- Panel related functions --- */

var loadPanels = function(pageN) {
  var page = myComic.getPage(pageN);
  for (var i = 1; i <= page.panelsLen; i++) {
    addPanel(pageN, i);
  }
};

var addPanel = function(pageN, panelN) {
  var panel = myComic.getPanelByIndex(pageN, panelN);
  var $img = appendImg(panel);
  addPanelForm(panel);
  addImgEvent($img);
  showResize(panel.id);
};

var addPanelForm = function(obj) {
  var $panel = $panelTemplate.clone();

  $panel.find('.panel-w-natural').val(obj.naturalW);
  $panel.find('.panel-h-natural').val(obj.naturalH);
  $panel.find('.panel-w').val(obj.w);
  $panel.find('.panel-h').val(obj.h);
  $panel.find('.panel-x').val(obj.x);
  $panel.find('.panel-y').val(obj.y);
  $panel.find('.panel-z').val(obj.z);
  
  $panel.find('.panel-page').val(obj.pageN);
  $panel.find('.panel-index').val(obj.panelN);
  $panel.find('.panel-id').val(obj.id);
  $panel.find('.panel-name').val(obj.name);

  if (useServer) {
    $panel.find('.panel-img').attr('src', LOCAL_STORAGE + '/' + obj.src);
  }
  else {
    $panel.find('.panel-img').attr('src', obj.src);
  }

  $panel.attr('id', 'panel' + obj.id);

  $panelsNav.append($panel);
};

var clearPanelsNav = function() {
  $panelsNav.html('');
};

var panelInfo = function(el) {
  var $el = $(el);
  var $panelWrapper = $el.closest('.panel');
  var id = $panelWrapper.find('.panel-id').val();
  var pageN = $panelWrapper.find('.panel-page').val();
  var panelN = $panelWrapper.find('.panel-index').val();
  return {
    id: id,
    pageN: pageN,
    panelN: panelN
  };
};

/* --- END Panel related functions --- */


/* --- Page related functions --- */

var clearPagesNav = function() {
  $pagesNav.html('');
};

var addPageNav = function(index) {
  var $li = $pageTemplate.clone();
  $li.attr('id', 'page-' + index)
    .attr('data-page', index);
  if ($pagesNav.is(':empty')) {
    $pagesNav.append($li);
  }
  else {
    $pagesNav.find('li:eq(' + (index - 2) + ')').after($li);
  }
  var name = myComic.getPageName(index);
  if (name) {
    $li.find('.page-name').val(name);
  }
};

var loadPage = function(pageN) {
  CURRENT_PAGE = pageN;
  clearArtboard();
  clearPanelsNav();
  loadPanels(pageN);
  $('.page-nav.selected').removeClass('selected');
  $('#page-' + CURRENT_PAGE).addClass('selected');
};

var loadPages = function(pagesLen) {
  clearPagesNav();
  for (var i = 0; i < pagesLen; i++) {
    var c = i + 1;
    addPageNav(c);
  }
};

var pageInfo = function(el) {
  var $el = $(el);
  var $pageWrapper = $el.closest('.page-nav');
  var pageN = $pageWrapper.data('page') * 1;
  return pageN;
};

/* --- END Page related functions --- */


/* --- Creator related functions --- */

var addCreatorLine = function($el, v) {
  var $parent = $el.closest('.comic-creator-line');
  var $newEl = $comicCreatorLine.clone();
  $newEl.find('input[text]').val('');
  if (v) {
    $newEl.find('.comic-creator-name').val(v.name);
    $newEl.find('.comic-creator-role').val(v.role);
  }
  $parent.after($newEl);
};

var removeCreatorLine = function($el) {
  var $parent = $el.closest('.comic-creator-line');
  // debugger;
  if ($('.comic-creator-line').length === 1) {
    addCreatorLine($el);
  }
  $parent.remove();
};

var loadCreators = function(arr) {
  var $el = $('.comic-creator-name');
  var $parent = $el.closest('.comic-creator-line');
  $parent.find('.comic-creator-name').val(arr[0].name);
  $parent.find('.comic-creator-role').val(arr[0].role);
  for (var i = arr.length - 1; i > 0; i--) {
    addCreatorLine($el, arr[i]);
  }
};

var getCreators = function() {
  var lines = $('.comic-creator-line');
  var arr = [];
  for (var i = 0; i < lines.length; i++) {
    arr.push({
      name: lines.eq(i).find('.comic-creator-name').val(),
      role: lines.eq(i).find('.comic-creator-role').val()
    });
  }
  return arr;
};

/* --- END Creator related functions --- */


/* --- Artboard related functions --- */

var clearArtboard = function() {
  $artboard.html('');
};

/* --- END Artboard related functions --- */

var updateScreen = function() {
  var newW = $comicWidth.val();
  var newH = $comicHeight.val();

  var oldW = parseInt($artboard.css('width').replace('px',''));
  var oldH = parseInt($artboard.css('height').replace('px',''));

  console.log('interface.updateScreen newW: '+newW+', oldW: '+oldW+', newH: '+newH+', oldH: '+oldH);

  $artboard.css('width', newW + 'px');
  $artboard.css('height', newH + 'px');

  // eclayout just updated the comic model, and it's synchronous, so just get the updated % from there
  //var comicPanels = myComic.getPanels();
  var comicPanels = myComic.getPanelsByPage(CURRENT_PAGE);
  
  // update horizontally
  if (newW !== oldW) {
    for (var i = 0; i < comicPanels.length; i++) {
      var panel = comicPanels[i];
      var $el = $('#' + panel.id);
      // wrapper created by jqueryUI
      var $parEl = $el.closest('.ui-wrapper');
      console.log('HORIZONTAL panel id: '+panel.id);
      $el.css('width', panel.wPercent + '%');
      $parEl.css('width', panel.wPercent + '%');
      $el.css('left', panel.xPercent + '%');
      $parEl.css('left', panel.xPercent + '%');
    }
  }

  // update vertically
  if (newH !== oldH) {
    for (var i = 0; i < comicPanels.length; i++) {
      var panel = comicPanels[i];
      var $el = $('#' + panel.id);
      // wrapper created by jqueryUI
      var $parEl = $el.closest('.ui-wrapper');
      console.log('VERTICAL panel id: '+panel.id);
      $el.css('height', panel.hPercent + '%');
      $parEl.css('height', panel.hPercent + '%');
      $el.css('top', panel.yPercent + '%');
      $parEl.css('top', panel.yPercent + '%');
    }
  }
};

// var createHtml = function(save) {
//   var obj = myComic.returnJSON();
//   obj.save = save || false;
//   var source = $exportTemplate;
//   var template = Handlebars.compile(source);
//   var rendered = template(obj);
//   return rendered;
// };

var createTemplateContent = function(save) {
  var obj = myComic.returnJSON();
  obj.save = save || false;
  var template = {};
  var rendered = {};
  for (var i = 0; i < templateFiles.length; i++) {
    template[ templateFiles[i] ] = Handlebars.compile(templateFilesContent[ templateFiles[i] ]);
    rendered[ templateFiles[i] ] = template[ templateFiles[i] ](obj);
  }
  return rendered;
};

var loadComic = function() {
  var comicData = myComic.getComic();
  $comicName.val(comicData.title);
  $comicSummary.val(comicData.summary);
  $comicVersion.val(comicData.version);
  $comicOrientation.val(comicData.orientation || $comicOrientation.val());
  $comicDate.val(comicData.date);
  $comicWidth.val(comicData.screenW);
  $comicHeight.val(comicData.screenH);
  $comicPxRatio2.prop('checked', comicData.pxRatio === 2);
  $artboard.width(comicData.screenW).height(comicData.screenH);
  loadCreators(myComic.getCreators());

  loadPages(comicData.pagesLen);
  loadPage(CURRENT_PAGE);
};


// page
$pagesNav.sortable({
  handle: '.page-nav-handle',
  update: function(event, ui) {
    var pageN = ui.item.data('page');
    var newPageN = ui.item.index() + 1;
    var newLen = myComic.movePage(pageN, newPageN);
    loadPages(newLen);
    loadPage(newPageN);
    saveLocalStorage();
  }
});

$(document).on('change keyup', '.page-name', function() {
  var pageN = pageInfo(this);
  myComic.updatePageName(pageN, this.value);
  saveLocalStorage();
});

$(document).on('click', '.page-nav-add', function(e) {
  e.stopPropagation();

  var index = $(this).parent().data('page') * 1 + 1;
  var newLen = myComic.addPage(null, index);
  loadPages(newLen);
  loadPage(index);
  saveLocalStorage();
});

$(document).on('click', '.page-nav-clone', function(e) {
  e.stopPropagation();

  var index = $(this).parent().data('page') * 1 + 1;
  var originalPage = myComic.getPage(index - 1);
  // console.log(originalPage);
  // return;
  var newLen = myComic.addPage(originalPage, index);
  loadPages(newLen);
  loadPage(index);
  saveLocalStorage();
});

$(document).on('click', '.page-nav-remove', function(e) {
  e.stopPropagation();

  var check = confirm('Are you sure you want to delete this page?');
  if (check) {
    var index = $(this).parent().data('page') * 1;
    var newLen = myComic.removePage(index);
    if (CURRENT_PAGE === index && index !== 1) {
      index--;
    }
    loadPages(newLen);
    loadPage(index);
    saveLocalStorage();
  }
});

$(document).on('click', '.page-nav-handle', function(e) {
  e.stopPropagation();
});

$(document).on('click', '.js-page-nav', function() {
  var pageN = $(this).data('page') * 1;
  loadPage(pageN);
});

$('.pages-nav-add').on('click', function() {
  var index = myComic.addPage();
  loadPages(index);
  loadPage(index);
  saveLocalStorage();
});

// Close overlay
$('.overlay-close').on('click', function(e) {
  e.preventDefault();
  $(this).closest('.overlay').removeClass('show');
});

// Save/export fallback
// var showOutput = function(txt) {
//   $textareaOutput.val(txt);
//   $textareaOutputOverlay.addClass('show');
// };

// Read JSON
var readJSON = function(val) {
  try {
    var resObj = JSON.parse(val);
    // TODO function to check if the object is valid
    myComic.init(resObj);
    saveLocalStorage();
    loadComic();
  } catch (e) {
    // console.log('file format not valid');
    return false;
  }
  return true;
};

// Import fallback
$textareaInputButton.on('click', function() {
  var val = $textareaInput.val();
  var res = readJSON(val);
  if (res) {
    $('#textarea-input-close').trigger('click');
  }
});



// Clear
$('#comic-clear').on('click', function() {
  var check = confirm('Are you sure you want to delete everything?');
  if (check) {
    myComic.init();
    saveLocalStorage();
    loadComic();
  }
});


// comic
$(document).on('change keyup', '#comic-name', function() {
  myComic.updateTitle(this.value);
  saveLocalStorage();
});

$(document).on('change keyup', '#comic-summary', function() {
  myComic.updateSummary(this.value);
  saveLocalStorage();
});

$(document).on('change keyup', '#comic-version', function() {
  myComic.updateVersion(this.value);
  saveLocalStorage();
});

$(document).on('change keyup', '#comic-date', function() {
  myComic.updateDate(this.value);
  saveLocalStorage();
});

$(document).on('change', '#comic-orientation', function() {
  myComic.updateOrientation(this.value);
  saveLocalStorage();
});

$(document).on('change keyup', '.comic-creator-line input[type=text]', function() {
  myComic.updateCreators(getCreators());
  saveLocalStorage();
});

$(document).on('click', '.comic-creator-line .comic-creator-remove', function() {
  removeCreatorLine($(this));
  myComic.updateCreators(getCreators());
  saveLocalStorage();
});

$(document).on('click', '.comic-creator-line .comic-creator-add', function() {
  addCreatorLine($(this));
  myComic.updateCreators(getCreators());
  saveLocalStorage();
});

var updateComicWidth = debounce(function() {
  console.log('!!! COMIC WIDTH CHANGED: '+this.value);
  // recalculate all % in existing images and panels
  myComic.updateScreen(this.value);
  updateScreen();
  saveLocalStorage();
}, DEBOUNCE_TIME_KEYUP);

$(document).on('change keyup', '#comic-width', updateComicWidth);

var updateComicHeight = debounce(function() {
  console.log('!!! COMIC HEIGHT CHANGED: '+this.value);
  // recalculate all % in existing images and panels
  myComic.updateScreen(null, this.value);
  updateScreen();
  saveLocalStorage();
}, DEBOUNCE_TIME_KEYUP);

$(document).on('change keyup', '#comic-height', updateComicHeight);

$(document).on('change click', '#comic-pxratio-2', function() {
  var ratio = $(this).is(':checked') ? 2 : 1;
  // console.log(ratio);
  myComic.updatePxRatio(ratio);
  saveLocalStorage();
});


/* --- Panel: conditional code FileReader OR Server --- */

if (useLocal && isFileReader) {
  $('#panel-add').on('change', function(e) {
    var files = e.target.files;
    var pos = {
      x: 0,
      y: 0
    };
    for (var i = 0; i < files.length; i++) {
      addImg(files[i], pos);
    }
  });
}
else if (useServer) {
  $('#panel-add').on('change', function(e) {
    var files = e.target.files;
    if (files.length > 0) {
      $('#panel-add-submit').show();
    }
    else {
      $('#panel-add-submit').hide();
    }
    if (this.value === '') {
      $('#panel-add-submit').hide();
    }
  });

  $('#form-panel-add').on('submit', function(e) {
    e.preventDefault();
    var $this = $(this);
    var pos = {
      x: 0,
      y: 0
    };

    $.ajax({
      url: $this.attr('action') + '?id=' + LOCAL_STORAGE,
      type: $this.attr('method'),
      data: new FormData(this),
      dataType: 'json',
      processData: false,
      contentType: false,
      success: function(data) {
        // console.log(data);
        $('#panel-add').val('').trigger('change');
        if (data.form && data.form.panelAdd) {
          if (Array.isArray(data.form.panelAdd)) {
            $.each(data.form.panelAdd, function(i, obj) {
              addRelativeImg(obj, pos);
            });
          }
          else {
            addRelativeImg(data.form.panelAdd, pos);
          }
        }
      }
    });
  });
}
else {
  $('label[for="panel-add"]').hide();
}

/* --- END Panel: conditional code FileReader OR Server --- */


$panelsNav.sortable({
  handle: '.panel-nav-handle',
  update: function(event, ui) {
    var panel = panelInfo(ui.item);
    var newPanelN = ui.item.index() + 1;
    myComic.movePanel(panel.pageN, panel.panelN, newPanelN);
    loadPage(panel.pageN);
    saveLocalStorage();
  }
});

$(document).on('click', '.panel-nav-remove', function(e) {
  e.stopPropagation();

  var check = confirm('Are you sure you want to delete this image?');
  if (check) {
    var panel = panelInfo(this);
    myComic.removePanel(panel.pageN, panel.panelN);
    loadPage(panel.pageN);
    saveLocalStorage();
  }
});

$(document).on('click', '.panel-nav-original', function(e) {
  e.stopPropagation();
  var panel = panelInfo(this);
  var id = panel.id;
  var el = $('#' + id).find('img').get(0);
  var $panelWrapper = $('#panel' + id);
  var $w = $panelWrapper.find('.panel-w');
  var $h = $panelWrapper.find('.panel-h');
  var w = el.naturalWidth;
  var h = el.naturalHeight;
  console.log('resize code: naturalWidth: '+w+', naturalHeight: '+h+', image:', el);
  $w.val(w).trigger('change');
  $h.val(h).trigger('change');
});


$(document).on('change keyup', '.panel-w', function() {
  // console.log('change w');
  var panel = panelInfo(this);
  myComic.resizePanel(panel.pageN, panel.panelN, this.value);
  updateImg(panel.id, { w: this.value });
  saveLocalStorage();
  showResize(panel.id);
});
$(document).on('change keyup', '.panel-h', function() {
  // console.log('change h');
  var panel = panelInfo(this);
  myComic.resizePanel(panel.pageN, panel.panelN, null, this.value);
  updateImg(panel.id, { h: this.value });
  saveLocalStorage();
  showResize(panel.id);
});
$(document).on('change keyup', '.panel-x', function() {
  // console.log('change x');
  var panel = panelInfo(this);
  myComic.moveXYPanel(panel.pageN, panel.panelN, this.value);
  updateImg(panel.id, { x: this.value });
  saveLocalStorage();
});
$(document).on('change keyup', '.panel-y', function() {
  // console.log('change y');
  var panel = panelInfo(this);
  myComic.moveXYPanel(panel.pageN, panel.panelN, null, this.value);
  updateImg(panel.id, { y: this.value });
  saveLocalStorage();
});
$(document).on('change keyup', '.panel-z', function() {
  // console.log('change z');
  var panel = panelInfo(this);
  var val = this.value;
  if (val !== '' && val < 1) {
    val = 1;
    this.value = 1;
  }
  myComic.moveZPanel(panel.pageN, panel.panelN, val);
  updateImg(panel.id, { z: val });
  saveLocalStorage();
});


// Right click
$artboard.contextMenu({
  selector: 'div.artboard-img', 
  items: {
    'front': {
      name: 'Bring to front',
      callback: function() {
        var id = this.attr('id');
        var $z = getPanelForm(this).find('.panel-z');
        var zIndexes = getZIndexes(id);
        var biggest = zIndexes.pop();
        $z.val(biggest + 1)
          .trigger('change');
      }
    },
    'back': {
      name: 'Send to back',
      callback: function() {
        var id = this.attr('id');
        var $z = getPanelForm(this).find('.panel-z');
        var zIndexes = getZIndexes(id);
        var smallest = zIndexes.shift();
        $z.val(smallest - 1)
          .trigger('change');
      }
    },
    'sep1': '---------',
    'bringForward': {
      name: 'Bring Forward',
      callback: function() {
        var $z = getPanelForm(this).find('.panel-z');
        $z.val( $z.val() * 1 + 1)
          .trigger('change');
      }
    },
    'sendBackward': {
      name: 'Send Backwards',
      callback: function() {
        var $z = getPanelForm(this).find('.panel-z');
        $z.val( $z.val() * 1 - 1)
          .trigger('change');
      }
    },
    'sep2': '---------',
    'resize': {
      name: 'Original size',
      callback: function() {
        getPanelForm(this)
          .find('.panel-nav-original')
          .trigger('click');
      }
    },
    'sep3': '---------',
    'delete': {
      name: 'Delete',
      callback: function() {
        getPanelForm(this)
          .find('.panel-nav-remove')
          .trigger('click');
      }
    }
  }
});
var getPanelForm = function($el) {
  var id = $el.attr('id');
  return $('#panel' + id);
};
var getZIndexes = function(avoidId) {
  var arr = [];
  var $li = $panelsNav.find('li:not(#panel' + avoidId + ')');
  for (var i = 0; i < $li.length; i++) {
    arr.push($li.eq(i).find('.panel-z').val() * 1);
  }
  arr.sort(function(a, b) {
    return a - b;
  });
  return arr;
};


/* --- Conditional code: NodeWebkitServer ONLY --- */

if (useNodeWebkitServer) {
  window.addEventListener('message', function(e) {
    if (e.origin !== 'file://') {
      return false;
    }

    var msg;
    try {
      msg = JSON.parse(e.data);
    } catch(err) {
      console.log('error in the received post message');
      return false;
    }
    if (msg.iframe !== LOCAL_STORAGE) {
      return false;
    }
    if (msg.type === 'save' || msg.type === 'close') {
      var content = createTemplateContent();
      for (var c in content) {
        if (content.hasOwnProperty(c) && c.indexOf('.json') >= 0) {
          try {
            content[c] = JSON.stringify(JSON.parse(content[c]));
          } catch (e) {

          }
        }
      }
      content['project.json.hbs'] = storage.getItem();
      
      var s = JSON.stringify(content);
      window.parent.postMessage('{"type": "' + msg.type + '", "iframe": "' + LOCAL_STORAGE + '", "content": ' + s + '}', '*');

      if (msg.type === 'close') {
        storage.clear();
      }
    }
    if (msg.type === 'saved') {
      isSavedRemote = msg.status;
    }
  }, false);
}

/* --- END Conditional code: NodeWebkitServer ONLY --- */


var existingComic = storage.get() || null;
var myComic = new Electricomic(existingComic);
loadComic();

$(window).bind('beforeunload', function(){
  if (!isSavedLocalStorage) {
    return 'Are you sure you want to leave? You will lose all changes!';
  }
});
