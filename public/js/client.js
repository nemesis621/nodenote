var user_id = (typeof($.cookie("user_id")) !== 'undefined')? $.cookie("user_id") : false;
console.log(user_id);


$(document).ready(function() {

    if(user_id){

        var iosocket = io.connect();
        iosocket.on('connect', function () {
            iosocket.json.send({user_id: user_id});


            $('#invite_button').click(function(){
                var emailfield = $('#invite_email');
                var emailinput = emailfield.val();

                // check email address
                if(!validateEmail(emailinput)){
                    emailfield.effect('shake', {distance: 10, times: 2});
                    return;
                } else {
                    iosocket.emit('friend_invitation', {
                        user_id: user_id,
                        email: emailinput
                    });
                    emailfield.val('');
                }
            });

            $('#invite_email').keypress(function(event) {
                if (event.which == 13) {
                    event.preventDefault();
                    var e = $.Event('click');
                    $('#invite_button').trigger(e);
                }
            });


        //        iosocket.on('message', function (message) {
        //            displayMessage(message);
        //        });
        //
        //        iosocket.on('disconnect', function () {
        //            $('#chatcontent').append('<li class="txt_red">Disconnected</li>');
        //        });
        });




    }


    // Kontaktformular validieren
    $('#contact_submit').click(function(){
        var emailfield = $('#contact_email');
        if(!validateEmail(emailfield.val())){
            emailfield.parent().addClass('has-error');
            emailfield.effect('shake', {distance: 10, times: 2});
            return false;
        }
    });

});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}