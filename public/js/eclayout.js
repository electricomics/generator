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

/**
 * Class to manipulate the structure of the comic
 * It should be independent from the UI used to create it
 */
var Electricomic = function(existingComic) {
  var _comic;
  var _today = new Date();
  var Comic = function() {
    return {
      title: 'Electricomic',
      summary: '',
      version: 1,
      date: _today,
      dateString: _today.getDate() + '/' + (_today.getMonth() + 1) + '/' + _today.getFullYear(),
      creators: [],
      screenW: 1024,
      screenH: 768,
      pxRatio: 1,
      orientation: 'landscape',
      pages: [null]
    };
  };
  var Creators = function() {
    return {
      name: '',
      role: '',
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
      wPercent: 0,
      hPercent: 0,
      xPercent: 0,
      yPercent: 0,
      naturalW: 0,
      naturalH: 0,
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
      summary: _comic.summary,
      version: _comic.version,
      date: _comic.date,
      dateString: _comic.dateString,
      creators: this.getCreators(),
      screenW: _comic.screenW,
      screenH: _comic.screenH,
      pxRatio: _comic.pxRatio,
      orientation: _comic.orientation,
      pagesLen: pagesLen
    };
  };

  this.getCreators = function() {
    var arr = [];
    for (var i = 0; i < _comic.creators.length; i++) {
      arr.push({
        name: _comic.creators[i].name,
        role: _comic.creators[i].role
      });
    }
    return arr;
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
      wPercent: panel.wPercent,
      hPercent: panel.hPercent,
      xPercent: panel.xPercent,
      yPercent: panel.yPercent,
      naturalW: panel.naturalW,
      naturalH: panel.naturalH,
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
    // MM: TODO recalculate all percentage
  };

  this.updatePxRatio = function(pxRatio) {
    editComic('pxRatio', pxRatio);
  };

  this.updateSummary = function(summary) {
    editComic('summary', summary);
  };

  this.updateVersion = function(version) {
    version = parseInt(version, 10);
    editComic('version', version);
  };

  this.updateOrientation = function(orientation) {
    editComic('orientation', orientation);
  };

  this.updateDate = function(date) {
    var d = new Date(date);
    editComic('date', date);
    editComic('dateString', d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear());
  };

  this.updateCreators = function(arr) {
    _comic.creators = [];
    for (var i = 0; i < arr.length; i++) {
      _comic.creators.push({
        name: arr[i].name,
        role: arr[i].role
      });
    }
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
      var wPercent = w * 100 / _comic.screenW;
      editPanel(pageN, panelN, 'wPercent', wPercent);
    }
    if (h != null) {
      editPanel(pageN, panelN, 'h', h);
      var hPercent = h * 100 / _comic.screenH;
      editPanel(pageN, panelN, 'hPercent', hPercent);
    }
  };

  this.moveXYPanel = function(pageN, panelN, x, y) {
    if (x != null) {
      editPanel(pageN, panelN, 'x', x);
      var xPercent = x * 100 / _comic.screenW;
      editPanel(pageN, panelN, 'xPercent', xPercent);
    }
    if (y != null) {
      editPanel(pageN, panelN, 'y', y);
      var yPercent = y * 100 / _comic.screenH;
      editPanel(pageN, panelN, 'yPercent', yPercent);
    }
  };

  this.moveZPanel = function(pageN, panelN, z) {
    editPanel(pageN, panelN, 'z', z);
  };

  this.init(existingComic);
};