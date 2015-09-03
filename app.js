/* global Electricomic */

var express = require('express');
var multer = require('multer');
var app = express();
var http = require('http');
var path = require('path');
var fs = require('fs');
var server;
var sockets = {};
var nextSocketId = 0;
var bodyParser = require('body-parser');

var done = false;

var options = {
  host: '0.0.0.0',
  port: 8000
};

var red = function() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (window.location.hostname !== options.host) { 
    window.location = 'http://' + options.host + ':' + options.port + '/loading.html';
  }
};


var start = function(mypath) {
  if (!mypath) {
    console.log('server not started, invalid path');
    return false;
  }
  //check if server is already running
  http.get(options, function(res) {
    console.log('server is running, redirecting to localhost');
    red();
  }).on('error', function(e) {
    //server is not yet running

    // configure multer
    app.use(multer({ dest: mypath + '/images',
      limits: {
        fieldSize: 100000000
      },
      rename: function (fieldname, filename) {
        return filename;
      },
      onFileUploadStart: function (file) {
        // console.log(file.originalname + ' is starting ...');
      },
      onFileUploadComplete: function (file) {
        // console.log(file.fieldname + ' uploaded to  ' + file.path);
        done = true;
      }
    }));

    // create package.json if it doesn't exist
    fs.exists(mypath + '/project.json', function(exists) {
      if (!exists) {
        var emptyComic = new Electricomic(null);
        fs.writeFile(mypath + '/project.json', JSON.stringify(emptyComic.returnJSON(), null, 2));
      }
    });

    // all environments
    app.set('port', options.port);
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.use('/comic', express.static(mypath));

    app.post('/upload',function(req, res){
      if (done === true){
        var txt = JSON.stringify(req.files);
        txt = JSON.parse(txt);
        if (txt.panelAdd) {
          if (Array.isArray(txt.panelAdd)) {
            for (var i = 0; i < txt.panelAdd.length; i++) {
              txt.panelAdd[i].path = txt.panelAdd[i].path.replace(mypath + '/', '');
            }
          }
          else {
            txt.panelAdd.path = txt.panelAdd.path.replace(mypath + '/', '');
          }
        }
        txt = JSON.stringify(txt);
        // console.log(txt);
        res.end('{"status": "ok", "form": ' + txt + '}');
      }
    });

    // create application/json parser
    var jsonParser = bodyParser.json();
    // create application/x-www-form-urlencoded parser
    var urlencodedParser = bodyParser.urlencoded({ extended: true });
    
    app.post('/close', urlencodedParser, function(req, res) {
      fs.writeFile(mypath + '/project.json', JSON.stringify(JSON.parse(req.body.content), null, 2));
      res.end('{"status": "ok"}');
      server.close(function() {
        console.log('closed');
      });
      for (var socketId in sockets) {
        console.log('socket', socketId, 'destroyed');
        sockets[socketId].destroy();
      }
    });

    server = http.createServer(app);
    server.listen(options.port, function(err) {
      console.log('server created');
      red();
    });

    server.on('connection', function (socket) {
      // Add a newly connected socket
      var socketId = nextSocketId++;
      sockets[socketId] = socket;
      console.log('socket', socketId, 'opened');

      // Remove the socket when it closes
      socket.on('close', function () {
        console.log('socket', socketId, 'closed');
        delete sockets[socketId];
      });
    });
  });
};