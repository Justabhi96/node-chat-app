const path = require('path');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const {generateMsg,generateLocationMsg} = require('./utils/message');
const {isString} = require('./utils/validation');
const publicPath = path.join(__dirname,'../public');
const {Users} = require('./utils/users');

var app = express();

//instead of express we are using http to create server since 
//express also uses http under the hood to create the server
//and also we want that server instance for socket functions
var server = http.createServer(app);

var io = socketIO(server);

var users = new Users();
var typingUsers = [];
app.use(express.static(publicPath));

io.on('connection',(socket) => {
    console.log("New user connected");

    socket.on('disconnect',() => {
        var user = users.removeUser(socket.id);
        typingUsers =  typingUsers.filter(name => user.name !== name);
        if(user){
            io.to(user.room).emit('showTypingMsg', typingUsers);
            io.to(user.room).emit('updateUserList', users.getUsersList(user.room));
            io.to(user.room).emit('newMsg',generateMsg('Admin', `${user.name} has left`));
        }
        console.log('one user disconnected');
    });
    
    //this is used to emit an event to a single connection
    //whereas "io.emit()" is used to emit an event to all the 
    //existing connections
    // socket.emit('newMsg',generateMsg('abhishek','what's up));
    
    socket.on('join',(params,callback) => {
        var re = true;
        let name = params.name.charAt(0).toUpperCase() + params.name.slice(1).toLowerCase();
        users.users.map((user) => {
            if(user.name.toLowerCase() === params.name.toLowerCase() && user.room === params.room){
                re=false;
            }
        });
        if(re === false){
            return callback('Username is already taken');
        }
        if(!isString(params.name) || !isString(params.room)){
            return callback('Inputs are not valid');
        }
        
        socket.join(params.room);
        //socket.leave(params.room);

        users.addUser(socket.id, name, params.room);
        io.to(params.room).emit('updateUserList',users.getUsersList(params.room));
        //below method is for users in the same group
        //io.to(params.room).emit();
        
        socket.emit('newMsg', generateMsg('admin','Welcome to chat app'),users.getUser(socket.id));
        socket.emit('showTypingMsg', typingUsers);
        socket.broadcast.to(params.room).emit('newMsg',
        generateMsg('admin',`${params.name} has joined`));
        callback();
    });

    socket.on('createMsg',(newMsg,callback) => {        
        var user = users.getUser(socket.id);

        //this method emits the event for all the users including 
        //the one emiting the event 
        //io.emit('newMsg',generateMsg(newMsg.from,newMsg.text));

        if(user && isString(newMsg.text)){
            io.to(user.room).emit('newMsg',generateMsg(user.name,newMsg.text));
        }
        callback();

        //this method will broadcast the event to all the users 
        //except the one who emmitted the event
        //socket.broadcast.emit('newMsg',generateMsg(newMsg.from,newMsg.text));
    });
    socket.on('createLocationMsg', (coords) => {
        var user = users.getUser(socket.id);
        if(user){
            io.to(user.room).emit('newLocationMsg',generateLocationMsg(user.name,
            coords.latitude,coords.longitude));
        }
    });
    socket.on('validatedUser',(params,callback) => {
        var valid = true;
        users.users.map((user) => {
            if(user.name.toLowerCase() === params.name.toLowerCase() && user.room === params.room){
                valid=false;
            }
        });
        callback(valid);
    });
    socket.on('typingUser',(typingUserID) => {
       var user = users.getUser(socket.id);
       if(typingUsers.indexOf(user.name) === -1){
            typingUsers.push(user.name);
            io.to(user.room).emit('showTypingMsg', typingUsers);
       }
    });
    socket.on('stoppedTyping', () => {
        var user = users.getUser(socket.id);
        typingUsers =  typingUsers.filter(name => user.name !== name);
        io.to(user.room).emit('showTypingMsg', typingUsers);
    });
});

server.listen(4000, () => {
    console.log("Server is running on port 4000");
});
