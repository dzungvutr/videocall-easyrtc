var express = require('express');
var path = require('path');
var fs = require('fs');
var easyrtc = require('easyrtc');
var ioSocket = require('socket.io');
//var https = require('https');
var port = process.env.PORT || 8443;

// Set process name
//process.title = "node-easyrtc";
var app = express();
// var server = https.createServer(
//     {
//         key: fs.readFileSync("./public/17049777-easyrtc-server-videocall.herokuapp.com.key"),
//         cert: fs.readFileSync("./public/17049777-easyrtc-server-videocall.herokuapp.com.cert")
//     }, app).listen(port);
var server = require('http').createServer(app).listen(port);
var io = require('socket.io').listen(server, { "log level": 1 });

var myIceServers = [
    { 'urls': 'stun:stun.l.google.com:19302' },
    {
        'urls': 'turn:numb.viagenie.ca:3478',
        'username': 'krtacc01@gmail.com',
        'credential': 'krtacc01'
    }
];


//easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("appIceServers", myIceServers);


//Config EJS
app.set("view engine", "ejs");
app.set("views", "./views");

//add directory public
app.use(express.static('public'));


var arrayUser = [];

io.sockets.on('connection', function(socket) {
    //console.log(socket.id);
    socket.on('client-sign-up', function(user) {
        var isExist = arrayUser.some(function(e) {
            return e.name === user.name;
        });
        socket.peerId = user.peerId;

        if (isExist) return socket.emit('sign-up-fail');
        arrayUser.push(user);

        // socket.un = user.name;
        // console.log(socket.un + " is connected");

        //server send list user to client
        socket.emit('server-send-user', arrayUser);

        //server send new user to all client
        socket.broadcast.emit('server-send-new-user', user);

    });

    //Disconnect
    socket.on('disconnect', function() {
        // console.log(socket.un + ' is disconnected');
        var index = arrayUser.findIndex(function(user) {
            return user.peerId === socket.peerId;
        });
        arrayUser.splice(index, 1);
        io.sockets.emit('client-disconnect', socket.peerId);
    });

});

app.get('/', function(req, res) {
    //res.send("<font color= cayan> WEBRTC - DZUNGVT");
    res.render("videocall");
});


// app.get("/videocall", function(req, res) {
//     res.render("videocall");
// });

// Start EasyRTC server
var rtc = easyrtc.listen(app, io);