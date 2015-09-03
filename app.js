var express = require('express');
var multer = require('multer');
var app = express();
var http = require('http');
var path = require('path');
var fs = require('fs');

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
        fs.appendFile(mypath + '/project.json', JSON.stringify(emptyComic.returnJSON(), null, 2));
      }
    });

    // all environments
    app.set('port', options.port);
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.use('/comic', express.static(mypath));

    app.post('/upload',function(req, res){
      if(done === true){
        // console.log(req.files);
        res.end('{"status": "ok", "form": ' + JSON.stringify(req.files) + '}');
      }
    });

    http.createServer(app).listen(options.port, function(err) {
      console.log('server created');
      red();
    });
  });
};


var stop = function() {

};