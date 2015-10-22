/* global $ */
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

// for debugging purposes
var DEBUG = true;

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
// var livereload = require('express-livereload');
var livereload = require('livereload');

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

// livereload
var livereloadConfig = {
  // watchDir: path.join(process.cwd(), 'public')
};
var livereloadServer;

// hack to make keyboard shortcuts work (at least under Mac OS)
// https://github.com/nwjs/nw.js/issues/2462
var nativeMenuBar = new nwgui.Menu({ type: 'menubar' });
try {
  nativeMenuBar.createMacBuiltin('Electricomics Generator');
  win.menu = nativeMenuBar;
} catch (err) {
  // console.log(err.message);
}

// prevent backspace key from navigating back
// to fix as this jack would block all the back keys, even on input fields
// $(document).on('keydown', function(e) {
//   if (e.keyCode === 8) {
//     e.preventDefault();
//     return false;
//   }
// });

// address of the created server
// the port will be in an advanded setting panel to avoid collision with existent servers
var options = {
  host: '127.0.0.1',
  port: 8123
};
var serverUrl = 'http://' + options.host + ':' + options.port;

// what do we save in local memory for each project?
// id is a unique for the session identifier, formed of:
// a counter, increased for every open project in the session
// name of the open project without the extension.
// with session we mean the time during which the app is open.
// when the app is closed and reopen the session restart, so does the counter
// project[id] = { fsPath, serverPath, name, saved, files: { nameOfFile: { saved: bool } } }
var projects = {};
var projectsCounter = 0;
var projectExt = '.elcxproject';
var projectExtReg = new RegExp(projectExt + '$', 'i');
var archiveExt = '.elcx';
var iframesOpen = 0;
var currentProject;
// to be kept in sync with /public/js/interface.js var templateFiles
var projectsFiles = ['index.html', 'comic.json', 'project.json'];


/**
 * Asynchronously write json object into filesystem file
 * @param {string} path - Path of the file
 * @param {string} content - Content to write
 * @param {function} cb - Callback when writing is done ok
 */
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

/**
 * Asynchronously writes data to a file, replacing the file if it already exists
 * @param {string} path - Path of the file
 * @param {string} content - Content to write
 * @param {function} cb - Callback when writing is done ok
 */
var writeFile = function(path, content, cb) {
  fs.writeFile(path, content, cb);
};

/**
 * Compress project folder into our own archive
 * http://soledadpenades.com/2014/01/22/compressing-files-with-node-js/
 * @param {string} mypath - Path and name of the created archive
 */
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


/*
 * Disable/enable top menu items depending if any project is open or not
 * Items like "save project" or "close project" should not be available if no project is open
 */
var iframeFrill = function() {
  if (iframesOpen <= 0) {
    $menuItemProject.addClass('menu-item-disabled');
  }
  else {
    $menuItemProject.removeClass('menu-item-disabled');
  }
};

/**
 * Add an iframe with the open project url and its relative tab
 * @param {string} id - Project id
 */
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

/**
 * Remove iframe and tab of selected project and focus the one on its left or its right
 * @param {string} id - Project id
 */
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

/**
 * Focus selected open project
 * @param {string} id - Project id
 */
var iframeSelect = function(id) {
  currentProject = id;
  $('.iframe-selected').removeClass('iframe-selected');
  iframes[currentProject].addClass('iframe-selected');
  $('.tab-selected').removeClass('tab-selected');
  tabs[currentProject].addClass('tab-selected');
};


// configure multer
// multer is the middleware for handling the upload of images
var multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    var id = req.query.id;
    // all the images will always end up in the `images` folder of the comic project
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


/**
 * Start the local server
 */
var serverStart = function() {
  //check if server is already running
  http.get(options, function(res) {
    console.log('server is already running');
  }).on('error', function(e) {
    //server is not yet running

    // all environments
    app.set('port', options.port);
    app.use(express.static(path.join(process.cwd(), 'public')));

    // middleware for adding the livereload script to the response
    app.use(require('connect-livereload')());
    // add livereload functionality to express
    // var xx = livereload(app, livereloadConfig);
    // console.log(xx);
    livereloadServer = livereload.createServer(livereloadConfig);

    // all the projects will upload to the same url, but they will send their
    // project id into the query string to tell the server into which physical
    // folder it should save the file. this is due to the fact that there is no
    // other way at the moment to pass to multer this information
    app.post('/upload', multerUpload.fields([{name: 'panelAdd'}]), function(req, res) {
      var id = req.query.id;
      var txt = JSON.stringify(req.files);
      console.log(txt);
      txt = JSON.parse(txt);
      if (txt.panelAdd) {
        if (Array.isArray(txt.panelAdd)) {
          for (var i = 0; i < txt.panelAdd.length; i++) {
            txt.panelAdd[i].path = txt.panelAdd[i].path.replace(projects[id].fsPath + path.sep, '');
          }
        }
        else {
          txt.panelAdd.path = txt.panelAdd.path.replace(projects[id].fsPath + path.sep, '');
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

/**
 * Stop the local server
 */
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


/**
 * Open project
 * @param {string} path - Path in the filesystem of the project
 * @param {string} name - Name in the filesystem of the project/file - It can be with or without extension, we take care of this later
 */
var projectOpen = function(path, name) {
  if (!path) {
    return false;
  }

  // if folder doesn't have our extension we throw a message notifing the error and asking
  // if the user want to select another folder
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

  // folder doesn't exist, just do nothing and save current valid open projects in memory
  var ko = function() {
    localStorage.setItem('projects', JSON.stringify(projects));
  };

  // folder exists
  var ok = function() {
    for (var p in projects) {
      if (projects.hasOwnProperty(p)) {
        // check if this filesystem path aka the project has been already opened
        if (projects[p].fsPath === path) {
          return false;
        }
      }
    }
    // create session data of this project
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
    app.get('/' + id, function (req, res) {
      console.log('aaa', req.originalUrl);
      // res.send(res.body);
    });
    app.use('/' + id, express.static(path));
    // save that we opened this project
    localStorage.setItem('projects', JSON.stringify(projects));
    // livereload
    livereloadServer.watch(path);
    // load iframe
    iframeAdd(id);
  };
};

/**
 * Open all projects that were open when app was closed last time
 */
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

/**
 * Send a message to the iframe of the selected project
 * Communications between the app container (which runs under file://) and the pages in the local server (which runs under http://) can ben done only through window.postMessage (a method that enables cross-origin communication)
 * @param {string} type - Type of the message
 * @param {string} id - Project id
 */
var projectStartMessage = function(type, id) {
  var projectId = id || currentProject;
  iframes[projectId].get(0).contentWindow.postMessage('{"type": "'+ type + '", "iframe": "' + projectId + '"}', serverUrl);
};

/**
 * Save project - writes the content sent from the local server into physical files. We don't want the functionality to actually create the content based on template+data in this side of the app
 * @param {object} content - Object containing file names and the content to write into
 * @param {string} id - Project id
 * @param {function} cb - Callback when saving is done ok
 */
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
        console.log('file ' + projects[projectId].fsPath + path.sep + file + ' not ready to be saved');
        return false;
      }
    }
  }
  // reset the saved status
  for (var ff in projects[projectId].files) {
    if (projects[projectId].files.hasOwnProperty(ff)) {
      projects[projectId].files[ff].saved = false;
    }
  }

  // the content sent from the server is an object where each key is the name of
  // a file, and it's value the text to write into the file
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

/**
 * Change saved status of the project
 * @param {string} id - Project id
 * @param {boolean} status - Status of the project
 * @param {function} cb - Callback when status is changed
 */
var projectSaved = function(id, status, cb) {
  var projectId = id || currentProject;
  // send message to the iframe with the new status - could this be made better?
  iframes[projectId].get(0).contentWindow.postMessage('{"type": "saved", "iframe": "' + projectId + '", "status": ' + status + '}', serverUrl);
  projects[projectId].saved = status;
  tabs[projectId].toggleClass('tab-unsaved', !status);
  if (cb) {
    cb();
  }
};

/**
 * Check if all the files of the project are saved (which is a status we change before and after writing them in the filesystem)
 * @param {string} id - Project id
 * @returns {boolean} true if all files are saved
 */
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

/**
 * Create new project
 * @param {string} newPath - Path in the filesystem where to save the project
 * @param {string} name - Name of the project. It can be with or without extension, we take care of this later
 */
var projectNew = function(newPath, name) {
  // check if folder has our extension
  if (!projectExtReg.test(name)) {
    name += projectExt;
    newPath += projectExt;
  }

  // create folder and copy files from our own folder
  var save = function() {
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
  
  // if the folder we want to create already exists, we throw a message notifing
  // the error and asking if the user want to choose another name or location
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

/**
 * Close project
 * @param {object} content - Object containing file names and the content to write into
 * @param {string} id - Project id
 */
var projectClose = function(content, id) {
  var projectId = id || currentProject;
  // close function
  var cb = function() {
    iframeClose(projectId);
    delete projects[projectId];
    localStorage.setItem('projects', JSON.stringify(projects));
    // todo unmount folder
  };
  // if project is already saved, just close it
  if (projects[projectId].saved) {
    cb();
  }
  // if project is not already saved, ask the user what to do
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
          // note the `cb` function as callback for when project is finally saved
          projectSave(content, projectId, cb);
        }
      }
    });
    confirm.dialog('open');
  }
  
};


// Listener for the postMessages from the iframes
window.addEventListener('message', function(e) {
  // check that that the messages come from our local server
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

// use the close event to catch every type of closing, not only the one from our
// top menu (e.g. keyboard shortcut close)
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
    // reset its value so it can catch the next event in case we select the same
    // previous value
    this.value = '';
  }
});

$openProject.on('change', function() {
  var path = this.files[0].path;
  var name = this.files[0].name;
  console.log(path, name);
  if (path !== '') {
    projectOpen(path, name);
    // reset its value so it can catch the next event in case we select the same
    // previous value
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
  // open comic preview in the system default browser
  nwgui.Shell.openExternal(path.join(serverUrl, projects[currentProject].serverPath));
});

$comicFolder.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  // open the project folder in the system finder
  nwgui.Shell.showItemInFolder(projects[currentProject].fsPath);
});

$comicExport.on('click', function() {
  if ($(this).hasClass('menu-item-disabled')) {
    return;
  }
  // create the project archive a level above the project folder, otherwise if
  // we create it in the same folder that it's trying to compress, it would
  // create a not nice loop trying to include itself
  createZip(projects[currentProject].fsPath);
  // open the project folder in the system finder
  nwgui.Shell.showItemInFolder(projects[currentProject].fsPath);
});

$(document).on('click', '.tab', function() {
  var id = $(this).data('iframe');
  iframeSelect(id);
});



serverStart();