var express = require('express');
var app = express();

/*Handling routes.*/
app.use(express.static(__dirname + '/'));

/*Run the server.*/
app.listen(process.env.PORT || 8000);