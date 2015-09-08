/* global $, mousePositionElement, Electricomic, confirm, Handlebars, Blob, saveAs, isLteIE9, Storage */

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
var $comicPxRatio2 = $('#comic-pxratio-2');
var $comicWidth = $('#comic-width');
var $comicHeight = $('#comic-height');
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

if (typeof isLteIE9 !== 'undefined' && isLteIE9) {
  var filereaderSWFopt = {
    filereader: 'js/lib/FileReader/filereader.swf'
  };
  $('input[type="file"').fileReader(filereaderSWFopt);
}

var ID = function() {
  return '_' + Math.random().toString(36).substr(2, 9);
};

var storage = new Storage(LOCAL_STORAGE);

var saveLocalStorage = function() {
  var val = myComic.returnJSON();
  var isSaved = storage.save(val);
  isSavedLocalStorage = false;
  if (isSaved) {
    isSavedLocalStorage = true;
  }
};

var realSizeImg = function($el) {
  var realImg = $el.find('img').get(0);
  var w = realImg.naturalWidth;
  var h = realImg.naturalHeight;
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
  if (w === wNatural && h === hNatural) {
    $resized.removeClass('show');
    $original.removeClass('show');
  }
  else {
    $resized.addClass('show');
    $original.addClass('show');
  }
};

// var clearLocalStorage = function() {
//   storage.clear();
// };

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

var addImgFile = function(imgFile, pos) {
  var zIndexes = getZIndexes('');
  var biggest = zIndexes.pop();
  if (biggest == null) {
    biggest = 0;
  }
  var newImg = {
    id: ID(),
    src: imgFile.src,
    x: pos.x,
    y: pos.y,
    z: biggest + 1,
    name: imgFile.name
  };
  var $img = appendImg(newImg);
  var w = $img.width();
  var h = $img.height();

  // TODO: make it flexible for future pixel ratio
  if ($comicPxRatio2.is(':checked')) {
    w = w / 2;
    h = h / 2;
    $img.css('width', w + 'px');
    $img.css('height', h + 'px');
  }
  
  newImg.w = w;
  newImg.h = h;

  var realSize = realSizeImg($img);
  newImg.naturalW = realSize.w;
  newImg.naturalH = realSize.h;

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

var clearArtboard = function() {
  $artboard.html('');
};

var clearPanelsNav = function() {
  $panelsNav.html('');
};

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

var loadPanels = function(pageN) {
  var page = myComic.getPage(pageN);
  for (var i = 1; i <= page.panelsLen; i++) {
    addPanel(pageN, i);
  }
};

var addPanel = function(pageN, panelN) {
  var panel = myComic.getPanelByIndex(pageN, panelN);
  var $img = appendImg(panel);
  var realSize = realSizeImg($img);
  panel.naturalW = realSize.w;
  panel.naturalH = realSize.h;
  addPanelForm(panel);
  addImgEvent($img);
  showResize(panel.id);
};

var imgLoaded = function(obj, $img) {
  console.log('loaded', obj, $img);
  var $div = $('#' + obj.id);
  var w = 0;
  var h = 0;
  var $panelWrapper = $('#panel' + obj.id);
  var $w = $panelWrapper.find('.panel-w');
  var $h = $panelWrapper.find('.panel-h');
  
  w = $img.get(0).naturalWidth;
  h = $img.get(0).naturalHeight;
  
  $div.css('width', w + 'px');
  $div.css('height', h + 'px');

  $w.val(w);
  $w.trigger('change');
  $h.val(h);
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
  $div.attr('id', obj.id);
  $img.attr('src', src);
  $div.css('left', obj.x + 'px');
  $div.css('top', obj.y + 'px');
  $div.css('z-index', obj.z);
  $div.append($img);
  $artboard.append($div);

  // when we drop a new image on the artboard we don't know its size yet,
  // we need to append it first and then find it out
  if (obj.w == null || obj.h == null) {
    $img.one('load', function(e) {
      imgLoaded(obj, $(this), e);
    });
  }
  if (obj.w != null) {
    w = obj.w;
  }
  if (obj.h != null) {
    h = obj.h;
  }
  $div.css('width', w + 'px');
  $div.css('height', h + 'px');
  
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
      // console.log(ui.size.width, ui.size.height);
      $w.val(ui.size.width);
      $w.trigger('change');
      $h.val(ui.size.height);
      $h.trigger('change');
    }
  });
  // make it draggable
  $img.draggable({
    stop: function(event, ui) {
      // console.log(ui.position.left, ui.position.top);
      $x.val(ui.position.left);
      $x.trigger('change');
      $y.val(ui.position.top);
      $y.trigger('change');
    }
  });
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

var updateScreen = function() {
  var w = $comicWidth.val();
  var h = $comicHeight.val();
  $artboard.css('width', w + 'px');
  $artboard.css('height', h + 'px');
};

var updateImg = function(id, what) {
  var $el = $('#' + id);
  // wrapper created by jqueryUI
  var $parEl = $el.closest('.ui-wrapper');
  if (what.w != null) {
    $el.css('width', what.w + 'px');
    $parEl.css('width', what.w + 'px');
  }
  if (what.h != null) {
    $el.css('height', what.h + 'px');
    $parEl.css('height', what.h + 'px');
  }
  if (what.x != null) {
    $el.css('left', what.x + 'px');
    $parEl.css('left', what.x + 'px');
  }
  if (what.y != null) {
    $el.css('top', what.y + 'px');
    $parEl.css('top', what.y + 'px');
  }
  if (what.z != null) {
    $el.css('z-index', what.z);
    $parEl.css('z-index', what.z);
  }
};


var loadComic = function() {
  var comicData = myComic.getComic();
  $comicName.val(comicData.title);
  $comicWidth.val(comicData.screenW);
  $comicHeight.val(comicData.screenH);
  $comicPxRatio2.prop('checked', comicData.pxRatio === 2);
  $artboard.width(comicData.screenW).height(comicData.screenH);

  loadPages(comicData.pagesLen);
  loadPage(CURRENT_PAGE);
};

var loadPages = function(pagesLen) {
  clearPagesNav();
  for (var i = 0; i < pagesLen; i++) {
    var c = i + 1;
    addPageNav(c);
  }
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

var pageInfo = function(el) {
  var $el = $(el);
  var $pageWrapper = $el.closest('.page-nav');
  var pageN = $pageWrapper.data('page') * 1;
  return pageN;
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

$(document).on('change keyup', '#comic-width', function() {
  myComic.updateScreen(this.value);
  updateScreen();
  saveLocalStorage();
});

$(document).on('change keyup', '#comic-height', function() {
  myComic.updateScreen(null, this.value);
  updateScreen();
  saveLocalStorage();
});

$(document).on('change click', '#comic-pxratio-2', function() {
  var ratio = $(this).is(':checked') ? 2 : 1;
  // console.log(ratio);
  myComic.updatePxRatio(ratio);
  saveLocalStorage();
});


// panel
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
    }
    if (msg.type === 'saved') {
      console.log(LOCAL_STORAGE + ' saved');
    }
  }, false);
}


var existingComic = storage.get() || null;
var myComic = new Electricomic(existingComic);
loadComic();

$(window).bind('beforeunload', function(){
  if (!isSavedLocalStorage) {
    return 'Are you sure you want to leave? You will lose all changes!';
  }
});
