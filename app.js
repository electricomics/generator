/* global $ */

var DEBUG = false;

var nwgui = require('nw.gui');
var win = nwgui.Window.get();
var express = require('express');
var multer = require('multer');
var app = express();
var http = require('http');
var path = require('path');
var fs = require('fs');
var archiver = require('archiver');
var ncp = require('ncp').ncp;

// server stuff
var server;
var sockets = {};
var nextSocketId = 0;

if (DEBUG) {
  win.showDevTools();
}
else {
  // win.maximize();
}

var nativeMenuBar = new nwgui.Menu({ type: 'menubar' });
try {
  nativeMenuBar.createMacBuiltin('Electricomics Generator');
  win.menu = nativeMenuBar;
} catch (err) {
  // console.log(err.message);
}

// prevent backspace key from navigating back
// $(document).on('keydown', function(e) {
//   if (e.keyCode === 8) {
//     e.preventDefault();
//     return false;
//   }
// });

var options = {
  host: '127.0.0.1',
  port: 8123
};
var serverUrl = 'http://' + options.host + ':' + options.port;

// project[id] = { fsPath, serverPath, name, saved, files: { nameOfFile: { saved: bool } } }
var projects = {};
var projectsCounter = 0;
var projectExt = '.elcxproject';
var projectExtReg = new RegExp(projectExt + '$', 'i');
var archiveExt = '.elcx';
var iframesOpen = 0;
var currentProject;
var projectsFiles = ['index.html', 'comic.json', 'project.json'];


var writeJSON = function(path, content, cb) {
  var c;
  try {
    c = JSON.stringify(content, null, 2);
  }
  catch (e) {
    c = content;
  }
  writeFile(path, c, cb);
};

var writeFile = function(path, content, cb) {
  fs.writeFile(path, content, cb);
};

var createZip = function(mypath) {
  console.log('zip');
  var outputPath = mypath + archiveExt;
  var srcDirectory = mypath;
  var output = fs.createWriteStream(outputPath);
  var zipArchive = archiver('zip');
  output.on('close', function() {
    console.log('done with the zip', outputPath);
  });
  zipArchive.pipe(output);
  zipArchive.bulk([
    { src: [ '**/*' ], cwd: srcDirectory, expand: true }
  ]);
  zipArchive.finalize(function(err, bytes) {
    if (err) {
      throw err;
    }
    console.log('done: ', bytes);
  });
};


var iframeFrill = function() {
  if (iframesOpen <= 0) {
    $menuItemProject.addClass('menu-item-disabled');
  }
  else {
    $menuItemProject.removeClass('menu-item-disabled');
  }
};

var iframeAdd = function(id) {
  var $newIframe = $('<iframe class="iframe" src="' + serverUrl + '/loading.html?id=' + id + '&path=' + projects[id].serverPath + '" frameborder="0" id="iframe-' + id + '"></iframe>');
  var $newTab = $('<span class="tab" id="tab-' + id + '" data-iframe="' + id + '">' + projects[id].name + '</span>');
  $iframes.append($newIframe);
  $tabs.append($newTab);
  iframes[id] = $newIframe;
  tabs[id] = $newTab;
  iframeSelect(id);
  iframesOpen++;
  iframeFrill();
};

var iframeClose = function(id) {
  var prevIframe = tabs[id].prev();
  var nextIframe = tabs[id].next();
  if (prevIframe.length > 0) {
    iframeSelect(prevIframe.data('iframe'));
  }
  else if (nextIframe.length > 0) {
    iframeSelect(nextIframe.data('iframe'));
  }
  iframes[id].remove();
  tabs[id].remove();
  delete iframes[id];
  delete tabs[id];
  iframesOpen--;
  iframeFrill();
};

var iframeSelect = function(id) {
  currentProject = id;
  $('.iframe-selected').removeClass('iframe-selected');
  iframes[currentProject].addClass('iframe-selected');
  $('.tab-selected').removeClass('tab-selected');
  tabs[currentProject].addClass('tab-selected');
};


// configure multer
var multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    var id = req.query.id;
    cb(null, projects[id].fsPath + '/images');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
var multerUpload = multer({
  storage: multerStorage,
  limits: {
    fieldSize: 100000000
  }
});


var serverStart = function() {
  //check if server is already running
  http.get(options, function(res) {
    console.log('server is already running');
  }).on('error', function(e) {
    //server is not yet running

    // all environments
    app.set('port', options.port);
    app.use(express.static(path.join(process.cwd(), 'public')));

    app.post('/upload', multerUpload.fields([{name: 'panelAdd'}]), function(req, res) {
      var id = req.query.id;
      var txt = JSON.stringify(req.files);
      txt = JSON.parse(txt);
      if (txt.panelAdd) {
        if (Array.isArray(txt.panelAdd)) {
          for (var i = 0; i < txt.panelAdd.length; i++) {
            txt.panelAdd[i].path = txt.panelAdd[i].path.replace(projects[id].fsPath + '/', '');
          }
        }
        else {
          txt.panelAdd.path = txt.panelAdd.path.replace(projects[id].fsPath + '/', '');
        }
      }
      txt = JSON.stringify(txt);
      res.end('{"status": "ok", "form": ' + txt + '}');
    });

    server = http.createServer(app);
    server.listen(options.port, function(err) {
      console.log('server created');
      projectOpenAll();
    });

    server.on('connection', function (socket) {
      // Add a newly connected socket
      var socketId = nextSocketId++;
      sockets[socketId] = socket;
      // console.log('socket', socketId, 'opened');

      // Remove the socket when it closes
      socket.on('close', function () {
        // console.log('socket', socketId, 'closed');
        delete sockets[socketId];
      });
    });
  });
};

// not sure I need this
// var serverStop = function() {
//   if (server) {
//     server.close(function() {
//       console.log('closed');
//     });
//     for (var socketId in sockets) {
//       if (sockets.hasOwnProperty(socketId)) {
//         // console.log('socket', socketId, 'destroyed');
//         sockets[socketId].destroy();
//       }
//     }
//   }
// };


var projectOpen = function(path, name) {
  if (!path) {
    return false;
  }

  // if folder doesn't have our extension
  if (!projectExtReg.test(path)) {
    var confirm = $('#dialog-project-open').dialog({
      resizable: false,
      modal: true,
      width: 550,
      buttons: {
        'Yes': function() {
          $(this).dialog('close');
          $openProject.val('');
          $openProject.trigger('click');
        },
        'No': function() {
          $(this).dialog('close');
        }
      }
    });
    confirm.html('<p>Project <em>' + path + '</em> not valid, do you want to open another project?</p>');
    confirm.dialog('open');
    return false;
  }

  // check if folder physically exists
  fs.stat(path, function(err) {
    if (err == null) {
      // folder exists
      return ok();
    }
    else if (err.code === 'ENOENT') {
      // folder does not exist
      return ko();
    }
    else {
      // some other error that we threat as if folder exists
      return ok();
    }
  });

  var ko = function() {
    localStorage.setItem('projects', JSON.stringify(projects));
  };

  var ok = function() {
    for (var p in projects) {
      if (projects.hasOwnProperty(p)) {
        // check if this filesystem path aka the project has been already opened
        if (projects[p].fsPath === path) {
          return false;
        }
      }
    }
    projectsCounter++;
    var nameNoExt = name.replace(projectExtReg, '');
    var id = projectsCounter + '-' + nameNoExt;
    projects[id] = {
      name: nameNoExt,
      fsPath: path,
      serverPath: '/' + id,
      files: {},
      saved: true
    };
    for (var i = 0; i < projectsFiles.length; i++) {
      projects[id].files[ projectsFiles[i] ] = {
        saved: true
      };
    }
    // mount folder
    app.use('/' + id, express.static(path));
    // save that we opened this project
    localStorage.setItem('projects', JSON.stringify(projects));
    // load iframe
    iframeAdd(id);
  };
};

var projectOpenAll = function() {
  var proj;
  try {
    // try to load the projects that were opened in the last session
    proj = JSON.parse(localStorage.getItem('projects'));
  }
  catch (e) {
    return false;
  }
  for (var p in proj) {
    if (proj.hasOwnProperty(p)) {
      projectOpen(proj[p].fsPath, proj[p].name);
    }
  }
};

var projectStartMessage = function(type, id) {
  var projectId = id || currentProject;
  iframes[projectId].get(0).contentWindow.postMessage('{"type": "'+ type + '", "iframe": "' + projectId + '"}', serverUrl);
};

var projectSave = function(content, id, cb) {
  var projectId = id || currentProject;
  var files = content;
  var p;
  var c;
  var dest;

  // check if project files are ok to be written
  for (var file in projects[projectId].files) {
    if (projects[projectId].files.hasOwnProperty(file)) {
      if (projects[projectId].files[file].saved === false) {
        console.log('file ' + projects[projectId].fsPath + '/' + file + ' not ready to be saved');
        return false;
      }
    }
  }
  for (var ff in projects[projectId].files) {
    if (projects[projectId].files.hasOwnProperty(ff)) {
      projects[projectId].files[ff].saved = false;
    }
  }

  for (var f in files) {
    if (files.hasOwnProperty(f)) {
      dest = f.replace('.hbs', '');
      p = path.join(projects[projectId].fsPath, dest);
      if (f.indexOf('.json') >= 0) {
        try {
          c = JSON.parse(files[f]);
        }
        catch (e) {
          c = files[f];
        }
        writeJSON(p, c, (function(w) {
          w.saved = true;
          if (checkFilesStatus(projectId)) {
            projectSaved(projectId, true, cb);
          }
        })(projects[projectId].files[dest]));
      }
      else {
        writeFile(p, files[f], (function(w) {
          w.saved = true;
          if (checkFilesStatus(projectId)) {
            projectSaved(projectId, true, cb);
          }
        })(projects[projectId].files[dest]));
      }
    }
  }
};

var projectSaved = function(id, status, cb) {
  var projectId = id || currentProject;
  iframes[projectId].get(0).contentWindow.postMessage('{"type": "saved", "iframe": "' + projectId + '", "status": ' + status + '}', serverUrl);
  projects[projectId].saved = status;
  tabs[projectId].toggleClass('tab-unsaved', !status);
  if (cb) {
    cb();
  }
};

var checkFilesStatus = function(id) {
  var projectId = id || currentProject;
  for (var file in projects[projectId].files) {
    if (projects[projectId].files.hasOwnProperty(file)) {
      if (projects[projectId].files[file].saved === false) {
        return false;
      }
    }
  }
  return true;
};

var projectNew = function(newPath, name) {
  // check if folder has our extension
  if (!projectExtReg.test(name)) {
    name += projectExt;
    newPath += projectExt;
  }

  var save = function() {
    // create folder and copy files from our own folder
    var source = path.join(process.cwd(), 'comic');
    ncp(source, newPath, function (err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log('copy done');
    });
    
    // open the newly created project
    projectOpen(newPath, name);
  };
  var dontSave = function() {
    var confirm = $('#dialog-project-new').dialog({
      resizable: false,
      modal: true,
      width: 550,
      buttons: {
        'Yes': function() {
          $(this).dialog('close');
          $newProject.val('');
          $newProject.trigger('click');
        },
        'No': function() {
          $(this).dialog('close');
        }
      }
    });
    confirm.html('<p>Project <em>' + newPath + '</em> already exists, would you like to choose another name or location?</p>');
    confirm.dialog('open');
  };

  // check if folder already exists
  fs.stat(newPath, function(err) {
    if (err == null) {
      // file exists
      return dontSave();
    }
    else if (err.code === 'ENOENT') {
      // file does not exist
      return save();
    }
    else {
      // some other error that we threat as if file exists
      return dontSave();
    }
  });
};

var projectClose = function(content, id) {
  var projectId = id || currentProject;
  var cb = function() {
    iframeClose(projectId);
    delete projects[projectId];
    localStorage.setItem('projects', JSON.stringify(projects));
    // todo unmount folder
  };
  // check if we want so save
  if (projects[projectId].saved) {
    cb();
  }
  else {
    var confirm = $('#dialog-close-project').dialog({
      resizable: false,
      modal: true,
      width: 550,
      buttons: {
        'Close without saving': function() {
          $(this).dialog('close');
          cb();
        },
        Cancel: function() {
          $(this).dialog('close');
        },
        'Save and close': function() {
          $(this).dialog('close');
          projectSave(content, projectId, cb);
        }
      }
    });
    confirm.dialog('open');
  }
  
};


window.addEventListener('message', function(e) {
  if (e.origin !== serverUrl) {
    return false;
  }
  
  var msg;
  try {
    msg = JSON.parse(e.data);
  } catch(err) {
    console.log('error in the received post message');
    return false;
  }

  if (msg.type === 'save') {
    projectSave(msg.content, msg.iframe);
  }
  if (msg.type === 'close') {
    projectClose(msg.content, msg.iframe);
  }
  if (msg.type === 'changed') {
    projectSaved(msg.iframe, msg.status);
  }
}, false);



// UI
var $newProject = $('#new-project');
var $openProject = $('#open-project');
var $saveProject = $('#save-project');
var $closeProject = $('#close-project');
var $comicPreview = $('#comic-preview');
var $comicFolder = $('#comic-folder');
var $comicExport = $('#comic-export');
var $quit = $('#quit');
var $iframes = $('#iframes');
var iframes = {};
var $tabs = $('#tabs');
var tabs = {};
var $menuItemProject = $('.menu-item-project');


$quit.on('click', function() {
  var confirm = $('#dialog-close-app').dialog({
    resizable: false,
    modal: true,
    width: 550,
    buttons: {
      'Quit': function() {
        $(this).dialog('close');
        win.close();
      },
      Cancel: function() {
        $(this).dialog('close');
        return;
      }
    }
  });
  confirm.dialog('open');
});

win.on('close', function() {
  this.hide(); // Pretend to be closed already
  // todo save all projects
  this.close(true);
});

$newProject.on('change', function() {
  var path = this.files[0].path;
  var name = this.files[0].name;
  console.log(path, name);
  if (path !== '') {
    projectNew(path, name);
    this.value = '';
  }
});

$openProject.on('change', function() {
  var path = this.files[0].path;
  var name = this.files[0].name;
  console.log(path, name);
  if (path !== '') {
    projectOpen(path, name);
    this.value = '';
  }
});

$saveProject.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  projectStartMessage('save');
});

$closeProject.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  projectStartMessage('close');
});

$comicPreview.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  nwgui.Shell.openExternal(path.join(serverUrl, projects[currentProject].serverPath));
});

$comicFolder.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  nwgui.Shell.showItemInFolder(projects[currentProject].fsPath);
});

$comicExport.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  createZip(projects[currentProject].fsPath);
  nwgui.Shell.showItemInFolder(projects[currentProject].fsPath);
});

$(document).on('click', '.tab', function() {
  var id = $(this).data('iframe');
  iframeSelect(id);
});



serverStart();