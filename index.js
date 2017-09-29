var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

var bodyParser = require('body-parser');
app.use(bodyParser.json()); //soporte para codificar json
app.use(bodyParser.urlencoded({ 
	extended: true 
})); //Soporte para decodificar las url


var admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert("Luminer-9d6336a3a028.json"),
  databaseURL: "https://luminer-v1.firebaseio.com"
});


var FCM = require('fcm-push'); 

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/android', function(request, response) {
  response.render('pages/index');
});

//POST
//https://warm-atoll-90602.herokuapp.com/token-miner
//token
//Registrar el minero en firebase
var MinerURI = "miners";
app.post('/'+MinerURI, function(request, response){
	var id = request.body.id;
	var propietario = request.body.propietario;
	var alerts = request.body.alerts;

	var db = admin.database();
	var Miner = db.ref(MinerURI).push();

	Miner.set({
		id: id,
		propietario: propietario,
		alerts: alerts
	});

	var path = Miner.toString(); //devuelve toda la direccion + el identificador del registro
	var pathSplit = path.split(MinerURI + "/");
	var idAutoGenerated = pathSplit[1];

	var respuesta = generateResponseToMiner(db,idAutoGenerated);
	response.setHeader("Content-Type", "application/json");
	response.send(JSON.stringify(respuesta));
});

function generateResponseToMiner(db,idAutoGenerated){
	var respuesta = {};
	var usuario = "";
	var ref = db.ref("miners");
	ref.on("child_added",function(snapshot, prevChildKey){
		usuario = snapshot.val();
		respuesta = {
			identificador: idAutoGenerated,
			id: usuario.id,
			propietario: usuario.propietario
		};
	});
	return respuesta;
}



//POST
//https://warm-atoll-90602.herokuapp.com/token-device
//token
//Registrar el token de dispositivo android en firebase
var tokenDevicesURI = "token-device";
app.post('/'+tokenDevicesURI, function(request, response){
	var token = request.body.token;
	var id = request.body.id;
	var propietario = request.body.propietario;

	var db = admin.database();
	var tokenDevices = db.ref(tokenDevicesURI).push();

	tokenDevices.set({
		token: token,
		propietario: propietario,
		id: id,
	});

	var path = tokenDevices.toString(); //devuelve toda la direccion + el identificador del registro
	var pathSplit = path.split(tokenDevicesURI + "/");
	var idAutoGenerated = pathSplit[1];

	var respuesta = generateResponseToToken(db,idAutoGenerated);
	response.setHeader("Content-Type", "application/json");
	response.send(JSON.stringify(respuesta));
});


function generateResponseToToken(db,idAutoGenerated){
	var respuesta = {};
	var usuario = "";
	var ref = db.ref("token-device");
	ref.on("child_added",function(snapshot, prevChildKey){
		usuario = snapshot.val();
		respuesta = {
			identificador: idAutoGenerated,
			id: usuario.id,
			token: usuario.token,
			propietario: usuario.propietario
		};
	});
	return respuesta;
}



//GET
////https://warm-atoll-90602.herokuapp.com/miner-alert
//miner
//alert
app.get("/miner-alert/:miner/:alert", function(request,response){
	var miner = request.params.miner;
	var alert = request.params.alert;

	var db = admin.database();
	var ref = db.ref("miners");
	var usuario = ""

	var db

	var respuesta = {};
	respuesta = {
			miner: miner,
			alert: alert,
			send: "ok"
		};



	ref.orderByChild('id').equalTo(miner).on("child_added", function(snapshot) {
	    //console.log(snapshot.val());
	    var key = snapshot.key;
		console.log(key);
		var refAlerts = db.ref("miners/"+key+"/alerts/").push();

		refAlerts.set({
			alerts: alert
		});
	    //console.log(snapshot.val().propietario);
	    //console.log(snapshot.val().tokens[0]);
	    snapshot.val().tokens.forEach(function(token){
	    	//console.log(token);
	    	var mensaje = "El minero " + miner + " ha generado un error: " + alert; //alert: alta temperatura en GPU0
  			enviarNotificacion(token, mensaje);
	    });

	    response.send(JSON.stringify(snapshot.val()));
	},function(errorObject){
		console.log("The read failed: " + errorObject.code);
		respuesta = {
			miner: "",
			alert: "",
			send: "failed"
		};
		response.send(JSON.stringify(respuesta));
	});
});





//GET
//https://warm-atoll-90602.herokuapp.com/toque-animal
//id
//animal
app.get("/toque-animal/:id/:animal", function(request,response){
	var id = request.params.id;
	var animal = request.params.animal;

	var db = admin.database();
	var ref = db.ref("token-device/" + id);
	var usuario = ""

	var respuesta = {};

	ref.on("value", function(snapshot) {
		console.log(snapshot.val());
		usuario = snapshot.val();
		var mensaje = usuario.animal + "te dio un toque";
		enviarNotificacion(usuario.token, mensaje);
		respuesta = {
			id: id,
			token: usuario.token,
			animal: animal
		};
		response.send(JSON.stringify(respuesta));
	}, function(errorObject){
		console.log("The read failed: " + errorObject.code);
		respuesta = {
			id: "",
			token: "",
			animal: ""
		};
		response.send(JSON.stringify(respuesta));
	});
});


function enviarNotificacion(tokenDestinatario, mensaje){

	var serverKey = 'AIzaSyA6AxmCDGAPLHEaecPrEKV-F5YrS3JeeTY';
	var fcm = new FCM(serverKey);

	var message = {
	    to: tokenDestinatario, // required fill with device token or topics
	    collapse_key: '', 
	    data: {},
	    notification: {
	        title: 'Notificacion desde el servidor',
	        body: mensaje,
	        icon: "bitcoin_in_processor",
	        sound:"default",
	        color:"#00BCD4"
	    }
	};

	//callback style
	fcm.send(message, function(err, response){
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});

};


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
