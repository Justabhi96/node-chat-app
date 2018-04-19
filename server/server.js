const path = require('path');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const {generateMsg,generateLocationMsg} = require('./utils/message');

const publicPath = path.join(__dirname,'../public');

var app = express();

//instead of express we are using http to create server since 
//express also uses http under the hood to create the server
//and also we want that server instance for socket functions
var server = http.createServer(app);

var io = socketIO(server);

app.use(express.static(publicPath));

io.on('connection',(socket) => {
    console.log("New user connected");

    socket.emit('newMsg', generateMsg('admin','Welcome to chat app'));
    socket.broadcast.emit('newMsg',
        generateMsg('admin','New User joined'));

    socket.on('disconnect',() => {
        console.log("disconnected from client");
    });
    
    //this is used to emit an event to a single connection
    //whereas "io.emit()" is used to emit an event to all the 
    //existing connections
    // socket.emit('newMsg',generateMsg('abhishek','what's up));
    
    socket.on('createMsg',(newMsg,callback) => {        
        //this method emits the event for all the users including 
        //the one emiting the event 
        io.emit('newMsg',generateMsg(newMsg.from,newMsg.text));

        callback();

        //this method will broadcast the event to all the users 
        //except the one who emmitted the event
        //socket.broadcast.emit('newMsg',generateMsg(newMsg.from,newMsg.text));
    });
    socket.on('createLocationMsg', (coords) => {
        io.emit('newLocationMsg',generateLocationMsg('User',
            coords.latitude,coords.longitude));
    });
});

server.listen(4000, () => {
    console.log("Server is running on port 4000");
});
