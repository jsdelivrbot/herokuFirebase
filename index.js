var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

var bodyParser = require('body-parser');
app.use(bodyParser.json()); //soporte para codificar json
app.use(bodyParser.urlencoded({ 
	extended: true 
})); //Soporte para decodificar las url

var firebase = require("firebase");
firebase.initializeApp({
	serviceAccount: "Luminer-bab78d4d4524.json",
	databaseURL: "https://luminer-v1.firebaseio.com"
});

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/android', function(request, response) {
  response.render('pages/index');
});


//post
//https://warm-atoll-90602.herokuapp.com/token-device
//token
//var tokenDevicesURI = "token-device";
app.post('/token-device', function(request, response){
	var token = request.body.token;
	//response.send(request.body.token);
	var db = firebase.databas();
	var tokenDevices = db.ref("token-device").push();

	tokenDevices.set({
		token: token
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
