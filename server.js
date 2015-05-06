var express = require('express');
var multer = require('multer');
var app = express();

var done = false;

/*Configure the multer.*/
app.use(multer({ dest: './comic/images',
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

/*Handling routes.*/
app.use(express.static(__dirname + '/'));

app.post('/upload',function(req, res){
  if(done === true){
    // console.log(req.files);
    res.end('{"status": "ok", "form": ' + JSON.stringify(req.files) + '}');
  }
});

/*Run the server.*/
app.listen(process.env.PORT || 8000);