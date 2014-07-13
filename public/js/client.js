$(document).ready(function() {

    var iosocket = io.connect();
    iosocket.on('connect', function () {
        console.log('connected');
//        iosocket.on('message', function (message) {
//            displayMessage(message);
//        });
//
//        iosocket.on('disconnect', function () {
//            $('#chatcontent').append('<li class="txt_red">Disconnected</li>');
//        });
    });
});