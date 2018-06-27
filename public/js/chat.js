var socket = io();
let selectedImage = null;
let selectedEmoji = null;

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
socket.on('newMsg', function(msg, user) {
    if(user != undefined){
        let name = user.name.charAt(0).toUpperCase() + user.name.slice(1).toLowerCase();
        let room = user.room.charAt(0).toUpperCase() + user.room.slice(1).toLowerCase();
        $("#roomName").html(`${name} from ${room}`);
    }
    var formattedTime = moment(msg.createdAt).format('h:mm a');
    //below commented part was done by jquery and now it is being done
    //using 'mustache.js'
    var template = $("#message-template").html();
    var html = Mustache.render(template,{
        text: msg.text,
        from: msg.from,
        createdAt: formattedTime,
        image: null,
        showImage: 'none'
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

socket.on('showTypingMsg', function(typingUsers){
    $("#typingUserName").html('');
     typingUsers.map((username) => {
         $("#typingUserName").append(`<span> ${username} is typing... </span>`);
     });
});

socket.on('newMsgWithImage', function(msg, image, emojisrc) {
    var formattedTime = moment(msg.createdAt).format('h:mm a');
    //below commented part was done by jquery and now it is being done
    //using 'mustache.js'
    var template = $("#message-template").html();
    if(image !== null){
        var html = Mustache.render(template, {
            text: msg.text,
            from: msg.from,
            createdAt: formattedTime,
            image: image,
            showImage: 'block'
        });
    }
    else{
        var html = Mustache.render(template, {
            text: msg.text,
            from: msg.from,
            createdAt: formattedTime,
            image: image,
            showImage: 'none'
        });
    }
    $('#message-list').append(html);
    if (emojisrc !== null) {
        $(".message:last-child .message__body p").append(`<span><img src="${emojisrc}"/></span>`);
        $("#firstEmoji").css('display','none');
    }
     scrollToBottom()
    // console.log("New Message: ",msg);
    // var li = $('<li></li>');
    // li.text(`${msg.from} ${formattedTime}: ${msg.text}`);
    // $('#message-list').append(li);
});

$('#message-form').on('submit',(e) => {
    // var myFile = $('[type=file]').prop('files')[0];
    // console.log(myFile);
    var textMsg = $('[name=message]').val();
    e.preventDefault();
    if(textMsg || selectedImage || selectedEmoji){
        socket.emit('createMsg', {
            text: textMsg,
            image: selectedImage,
            emojisrc: selectedEmoji
        }, function () {
            $('[name=message]').val('');
            $('[name=message]').select();
            socket.emit('stoppedTyping',socket.id);
            selectedImage = null;
            selectedEmoji = null;
            if(!$(".smileyDiv").hasClass('hidden')){
                $(".smileyDiv").toggleClass('hidden');
            }
        });
    }
});
$('#send-message-btn').on('click',(e) => {
    // var myFile = $('[type=file]').prop('files')[0];
    // console.log(myFile);
    var textMsg = $('[name=message]').val();
    //e.preventDefault();
    if(textMsg || selectedImage || selectedEmoji){
        socket.emit('createMsg', {
            text: textMsg,
            image: selectedImage,
            emojisrc: selectedEmoji
        }, function () {
            $('[name=message]').val('');
            $('[name=message]').select();
            socket.emit('stoppedTyping',socket.id);
            selectedImage = null;
            selectedEmoji = null;
            if(!$(".smileyDiv").hasClass('hidden')){
                $(".smileyDiv").toggleClass('hidden');
            }
        });
    }
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
    });
});

$(document).ready(function(){
    $("#messageInputBox").on('keyup', function(){
        if($("#messageInputBox").val()){
            socket.emit('typingUser', socket.id);
        }
        else{
            socket.emit('stoppedTyping',socket.id);
        }
    });

    $(".fileUpload").click(function(){
        $('[type=file]').trigger('click');
    });
    $('[type=file]').on('change',function(){
        if (this.files && this.files[0]) {
            var reader = new FileReader();
    
            reader.onload = function (e) {
                selectedImage = e.target.result;
            };
    
            reader.readAsDataURL(this.files[0]);
        }
    });
    $(".smiley").click(function(){
        $(".smileyDiv").toggleClass('hidden');
        //$(".smileyDiv").css('display','block');
    });
});

function openModal(element){
    var modalImg = $("#img01");
    $('#myModal').css('display','block');
    $("#img01").attr('src',element.src);
        
}
function closeModal(){ 
    $('#myModal').css('display','none');
}

function emojiClicked(element){
    let src = element.src;
    console.log(src)
    selectedEmoji = src;
    $("#firstEmoji").attr('src',src);
    $("#firstEmoji").css('display','block');
}
$("#cancelEmoji").click(function(){
    selectedEmoji = null;
    $("#firstEmoji").css('display','none');
});



