var Electricomic = function(existingComic) {
  var _comic;
  var Comic = function() {
    return {
      title: 'Electricomic',
      screenW: 1024,
      screenH: 768,
      pxRatio: 1,
      pages: [null]
    };
  };
  var Page = function() {
    return {
      id: '',
      name: '',
      show: true,
      panels: [null]
    };
  };
  var Panel = function() {
    return {
      id: '',
      name: '',
      src: '',
      w: 0,
      h: 0,
      x: 0,
      y: 0,
      z: 0
    };
  };

  this.init = function(obj) {
    if (obj) {
      _comic = obj;
    }
    else {
      _comic = new Comic();
      this.addPage();
    }
  };

  this.returnJSON = function() {
    return _comic;
  };

  this.getComic = function() {
    var pagesLen = _comic.pages.length - 1;

    return {
      title: _comic.title,
      screenW: _comic.screenW,
      screenH: _comic.screenH,
      pxRatio: _comic.pxRatio,
      pagesLen: pagesLen
    };
  };

  this.getPage = function(pageN) {
    if (pageN > _comic.pages.length - 1) {
      return false;
    }

    var page = _comic.pages[pageN];
    var panelsLen = page.panels.length - 1;

    return {
      id: page.id,
      name: page.name,
      show: page.show,
      panelsLen: panelsLen
    };
  };

  this.getPageName = function(pageN) {
    if (pageN > _comic.pages.length - 1) {
      return false;
    }

    return _comic.pages[pageN].name;
  };

  this.getPanelByIndex = function(pageN, panelN) {
    if (pageN > _comic.pages.length - 1) {
      return false;
    }
    if (panelN > _comic.pages[pageN].panels.length - 1) {
      return false;
    }
    var panel = _comic.pages[pageN].panels[panelN];
    return {
      id: panel.id,
      name: panel.name,
      src: panel.src,
      w: panel.w,
      h: panel.h,
      x: panel.x,
      y: panel.y,
      z: panel.z,
      pageN: pageN,
      panelN: panelN
    };
  };

  var checkPanel = function(panelId, pageN, panels) {
    var panel;
    for (var i = 1; i < panels.length; i++) {
      panel = panels[i];
      if (panel.id === panelId) {
        return this.getPanelByIndex(pageN, i);
      }
    }
    return false;
  };

  this.getPanelById = function(panelId, pageN) {
    var panels;
    var res;

    if (pageN == null) {
      for (var pg = 1; pg < _comic.pages.length; pg++) {
        panels = _comic.pages[pg].panels;
        res = checkPanel(panelId, pg, panels);
        if (res) {
          return res;
        }
      }
      return false;
    }

    panels = _comic.pages[pageN].panels;
    return checkPanel(panelId, pageN, panels);
  };

  var editComic = function(prop, val) {
    _comic[prop] = val;
  };

  this.updateTitle = function(title) {
    editComic('title', title);
  };

  this.updateScreen = function(w, h) {
    if (w != null) {
      editComic('screenW', w);
    }
    if (h != null) {
      editComic('screenH', h);
    }
  };

  this.updatePxRatio = function(pxRatio) {
    editComic('pxRatio', pxRatio);
  };

  this.addPage = function(pageObj, index) {
    if (index == null) {
      index = _comic.pages.length;
    }
    if (pageObj) {
      _comic.pages.splice(index, 0, pageObj);
    }
    else {
      _comic.pages.splice(index, 0, new Page());
    }
    return _comic.pages.length - 1;
  };

  this.removePage = function(pageN) {
    _comic.pages.splice(pageN, 1);
    return _comic.pages.length - 1;
  };

  this.movePage = function(pageN, newPageN) {
    var page = _comic.pages.splice(pageN, 1);
    _comic.pages.splice(newPageN, 0, page[0]);
    return _comic.pages.length - 1;
  };

  var editPage = function(pageN, prop, val) {
    _comic.pages[pageN][prop] = val;
  };

  this.updatePageName = function(pageN, name) {
    editPage(pageN, 'name', name);
  };

  this.addPanel = function(pageN, panelObj) {
    var newPanel;
    if (panelObj) {
      newPanel = panelObj;
    }
    else {
      newPanel = new Panel();
    }
    _comic.pages[pageN].panels.push(newPanel);
    return {
      pageN: pageN,
      panelN: _comic.pages[pageN].panels.length - 1
    };
  };

  this.removePanel = function(pageN, panelN) {
    _comic.pages[pageN].panels.splice(panelN, 1);
  };

  this.movePanel = function(pageN, panelN, newPanelN) {
    var panels = _comic.pages[pageN].panels;
    var panel = panels.splice(panelN, 1);
    panels.splice(newPanelN, 0, panel[0]);
    return panels.length - 1;
  };

  var editPanel = function(pageN, panelN, prop, val) {
    _comic.pages[pageN].panels[panelN][prop] = val;
  };

  this.resizePanel = function(pageN, panelN, w, h) {
    if (w != null) {
      editPanel(pageN, panelN, 'w', w);
    }
    if (h != null) {
      editPanel(pageN, panelN, 'h', h);
    }
  };

  this.moveXYPanel = function(pageN, panelN, x, y) {
    if (x != null) {
      editPanel(pageN, panelN, 'x', x);
    }
    if (y != null) {
      editPanel(pageN, panelN, 'y', y);
    }
  };

  this.moveZPanel = function(pageN, panelN, z) {
    editPanel(pageN, panelN, 'z', z);
  };

  this.init(existingComic);
};