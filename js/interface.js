/* global $, mousePositionElement, Electricomic, confirm, Mustache, Blob, saveAs */

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
var CURRENT_PAGE = 1;

var ID = function() {
  return '_' + Math.random().toString(36).substr(2, 9);
};

if (window.FileReader) {
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
    reader.addEventListener('loadend', function() {
      var newImg = {
        id: ID(),
        src: this.result,
        x: pos.x,
        y: pos.y,
        z: 0,
        name: file.name
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

      var newPanel = myComic.addPanel(CURRENT_PAGE, newImg);
      newImg.pageN = newPanel.pageN;
      newImg.panelN = newPanel.panelN;
      addPanelForm(newImg);
      addImgEvent($img);
      myComic.saveLocalStorage();
    });
  };
}
else {
  // TODO: fallback for FileReader
}

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
  addPanelForm(panel);
  addImgEvent($img);
};

var appendImg = function(obj) {
  var $img = $('<img>');
  var $div = $('<div class="artboard-img">');
  var w;
  var h;
  $div.attr('id', obj.id);
  $img.attr('src', obj.src);
  $div.css('left', obj.x + 'px');
  $div.css('top', obj.y + 'px');
  $div.css('z-index', obj.z);
  $div.append($img);
  $artboard.append($div);

  // when we drop a new image on the artboard we don't know it's size yet,
  // we need to append it first and then find it out
  if (obj.w != null) {
    w = obj.w;
  }
  else {
    w = $img.width();
  }
  if (obj.h != null) {
    h = obj.h;
  }
  else {
    h = $img.height();
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
    stop: function(event, ui) {
      console.log(ui.size.width, ui.size.height);
      $w.val(ui.size.width);
      $w.trigger('change');
      $h.val(ui.size.height);
      $h.trigger('change');
    }
  });
  // make it draggable
  $img.draggable({
    stop: function(event, ui) {
      console.log(ui.position.left, ui.position.top);
      $x.val(ui.position.left);
      $x.trigger('change');
      $y.val(ui.position.top);
      $y.trigger('change');
    }
  });
};

var addPanelForm = function(obj) {
  var $panel = $panelTemplate.clone();

  $panel.find('.panel-w').val(obj.w);
  $panel.find('.panel-h').val(obj.h);
  $panel.find('.panel-x').val(obj.x);
  $panel.find('.panel-y').val(obj.y);
  $panel.find('.panel-z').val(obj.z);
  
  $panel.find('.panel-page').val(obj.pageN);
  $panel.find('.panel-index').val(obj.panelN);
  $panel.find('.panel-id').val(obj.id);

  $panel.find('.panel-img').attr('src', obj.src);

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
    myComic.saveLocalStorage();
  }
});

$(document).on('change keyup', '.page-name', function() {
  var pageN = pageInfo(this);
  myComic.updatePageName(pageN, this.value);
  myComic.saveLocalStorage();
});

$(document).on('click', '.page-nav-add', function(e) {
  e.stopPropagation();

  var index = $(this).parent().data('page') * 1 + 1;
  var newLen = myComic.addPage(null, index);
  loadPages(newLen);
  loadPage(index);
  myComic.saveLocalStorage();
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
    myComic.saveLocalStorage();
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
  myComic.saveLocalStorage();
});


// buttons
$('#comic-export').on('click', function() {
  var obj = myComic.returnJSON();
  var template = $('#export-template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, obj);
  var blob = new Blob([rendered], {type: 'text/html;charset=utf-8'});
  saveAs(blob, 'file.html');
  // console.log(rendered);
});
$('#comic-clear').on('click', function() {
  var check = confirm('Are you sure you want to delete everything?');
  if (check) {
    myComic.clearLocalStorage();
    clearArtboard();
    clearPanelsNav();
    clearPagesNav();
  }
});


// comic
$(document).on('change keyup', '#comic-name', function() {
  myComic.updateTitle(this.value);
  myComic.saveLocalStorage();
});

$(document).on('change keyup', '#comic-width', function() {
  myComic.updateScreen(this.value);
  updateScreen();
  myComic.saveLocalStorage();
});

$(document).on('change keyup', '#comic-height', function() {
  myComic.updateScreen(null, this.value);
  updateScreen();
  myComic.saveLocalStorage();
});

$(document).on('change click', '#comic-pxratio-2', function() {
  var ratio = $(this).is(':checked') ? 2 : 1;
  console.log(ratio);
  myComic.updatePxRatio(ratio);
  myComic.saveLocalStorage();
});


// panel
$panelsNav.sortable({
  handle: '.panel-nav-handle',
  update: function(event, ui) {
    var panel = panelInfo(ui.item);
    var newPanelN = ui.item.index() + 1;
    myComic.movePanel(panel.pageN, panel.panelN, newPanelN);
    loadPage(panel.pageN);
    myComic.saveLocalStorage();
  }
});

$(document).on('click', '.panel-nav-remove', function(e) {
  e.stopPropagation();

  var check = confirm('Are you sure you want to delete this image?');
  if (check) {
    var panel = panelInfo(this);
    myComic.removePanel(panel.pageN, panel.panelN);
    loadPage(panel.pageN);
    myComic.saveLocalStorage();
  }
});


$(document).on('change keyup', '.panel-w', function() {
  console.log('change w');
  var panel = panelInfo(this);
  myComic.resizePanel(panel.pageN, panel.panelN, this.value);
  updateImg(panel.id, { w: this.value });
  myComic.saveLocalStorage();
});
$(document).on('change keyup', '.panel-h', function() {
  console.log('change h');
  var panel = panelInfo(this);
  myComic.resizePanel(panel.pageN, panel.panelN, null, this.value);
  updateImg(panel.id, { h: this.value });
  myComic.saveLocalStorage();
});
$(document).on('change keyup', '.panel-x', function() {
  console.log('change x');
  var panel = panelInfo(this);
  myComic.moveXYPanel(panel.pageN, panel.panelN, this.value);
  updateImg(panel.id, { x: this.value });
  myComic.saveLocalStorage();
});
$(document).on('change keyup', '.panel-y', function() {
  console.log('change y');
  var panel = panelInfo(this);
  myComic.moveXYPanel(panel.pageN, panel.panelN, null, this.value);
  updateImg(panel.id, { y: this.value });
  myComic.saveLocalStorage();
});
$(document).on('change keyup', '.panel-z', function() {
  console.log('change z');
  var panel = panelInfo(this);
  myComic.moveZPanel(panel.pageN, panel.panelN, this.value);
  updateImg(panel.id, { z: this.value });
  myComic.saveLocalStorage();
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



var myComic = new Electricomic();
loadComic();

// $(window).bind('beforeunload', function(){
//   return 'Are you sure you want to leave? You will Lose all changes!';
// });
