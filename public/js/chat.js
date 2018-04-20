var socket = io();
function scrollToBottom() {
    var messages = $("#message-list");
    var newMessage = messages.children('li:last-child');

    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop("scrollTop");
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if(clientHeight+scrollTop+newMessageHeight+lastMessageHeight >= scrollHeight){
        messages.scrollTop(scrollHeight);    
    }
}
socket.on('connect', function() {
    console.log('connected to server');
    //deparam is not a function on jquery library. it is available
    //by adding a deparam.js file in chat.html
    var params = $.deparam(window.location.search);
    socket.emit('join',params, function(err) {
        if(err){
            alert(err);
            window.location.href = '/';
        }else{
            console.log('no error');
        }
    });
    // socket.emit('createMsg',{
    //     from: 'Saurabh',
    //     text: "All is well"
    // });
});
socket.on('disconnect', function() {
    console.log("disconnected from server");
});
socket.on('newMsg', function(msg) {
    var formattedTime = moment(msg.createdAt).format('h:mm a');
    //below commented part was done by jquery and now it is being done
    //using 'mustache.js'
    var template = $("#message-template").html();
    var html = Mustache.render(template,{
        text: msg.text,
        from: msg.from,
        createdAt: formattedTime
    });
     $('#message-list').append(html);
     scrollToBottom()
    // console.log("New Message: ",msg);
    // var li = $('<li></li>');
    // li.text(`${msg.from} ${formattedTime}: ${msg.text}`);
    // $('#message-list').append(li);
});
socket.on('newLocationMsg', function (msg) {
    var formattedTime = moment(msg.createdAt).format('h:mm a');
    //below commented part was done by jquery and now it is being done
    //using 'mustache.js'
    var template = $("#location-message-template").html();
    var html = Mustache.render(template,{
        url: msg.url,
        from: msg.from,
        createdAt: formattedTime
    });
     $('#message-list').append(html);
     scrollToBottom()
    // var li = $('<li></li>');
    // var a = $('<a target="_blank">My current Location</a>');
    // li.text(`${msg.from} ${formattedTime}: `);
    // a.attr('href',msg.url);
    // li.append(a);
    //$('#message-list').append(li);
});
socket.on('updateUserList',function(users){
    var ol = $('<ol></ol>');
    users.forEach(function(user){
        ol.append($('<li></li>').text(user));
    });
    $("#users").html(ol);
});
$('#message-form').on('submit',(e) => {
    e.preventDefault();
    socket.emit('createMsg',{
        from: 'User',
        text: $('[name=message]').val()
    },function() {
        $('[name=message]').val('');
    });
});
var locationBtn = $('#location')
locationBtn.on('click', function(e) {
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser');
    }
    locationBtn.attr('disabled','disabled').text('Sending Location...');
    navigator.geolocation.getCurrentPosition(function(position){
        locationBtn.removeAttr('disabled').text('Send Location');
        socket.emit('createLocationMsg',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        });
    },function(){
        locationBtn.removeAttr('disabled').text('Send Location');
        alert('Unable to fetch location');
    })
});