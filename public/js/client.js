var user_id = (typeof($.cookie("user_id")) !== 'undefined')? $.cookie("user_id") : false;
var arFriends = {};


$(document).ready(function() {
    var document = $(this);

    if(user_id){
        var iosocket = io.connect();
        iosocket.on('connect', function () {
            iosocket.emit('auth', {user_id: user_id});

            iosocket.on('friend_invitation_response', function(data){
                if(data.status){
                   var target = $('#friendinvite .alert-success');
                } else {
                   var target = $('#friendinvite .alert-danger');
                   $('#friendinvitation_errmsg').html(data.errmsg);
                }
                // Erfolgesmeldung
                target.fadeIn().delay( 3500 ).fadeOut();
            });

            iosocket.on('new_friend_invitation', function(data){
                console.log(data);
                nn_addFriendinvitationEntry(data);
            });

            iosocket.on('new_friend', function(data){
                nn_addFriendEntry(data);
            });

            iosocket.on('response_new_note', function(data){
                nn_setDbNoteId(data);
            });


            iosocket.on('new_note', function(data){
                nn_addNoteToWorkbench(iosocket, false, data);
            });

            iosocket.on('note_content_change', function(data){
                nn_updateNodeContent(data);
            });


            document.on('click', '.friendinvaccept', function(){
                nn_respondInvitation($(this), iosocket, true);
            });

            document.on('click', '.friendinvdecline', function(){
                nn_respondInvitation($(this), iosocket, false);
            });

            $('#note_new').click(function(){
                nn_addNoteToWorkbench(iosocket, true, {});
            });

            $('#invite_button').click(function(e){
                var emailfield = $('#invite_email');
                var emailinput = emailfield.val();

                // check email address
                if(!nn_validateEmail(emailinput)){
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
        });
    }

//    $('.dropdown-menu .stayopen').live('click', function(e) {
//        e.stopPropagation();
//    });

    document.on('click', '.dropdown-menu .stayopen', function(e){
        e.stopPropagation();
    });

    // Kontaktformular validieren
    $('#contact_submit').click(function(){
        var emailfield = $('#contact_email');
        if(!nn_validateEmail(emailfield.val())){
            emailfield.parent().addClass('has-error');
            emailfield.effect('shake', {distance: 10, times: 2});
            return false;
        }
    });

    // Loginformular validieren
    $('#login_submit').click(function(){
        var emailfield = $('#login_email');
        var passfield = $('#login_pass');

        var error = false;

        if(!nn_validateEmail(emailfield.val())){
            emailfield.parent().addClass('has-error');
            emailfield.effect('shake', {distance: 10, times: 2});
            error = true;
        } else {
            emailfield.parent().removeClass('has-error');
        }

        if(passfield.val() == ''){
            passfield.parent().addClass('has-error');
            passfield.effect('shake', {distance: 10, times: 2});
            error = true;
        } else {
            passfield.parent().removeClass('has-error');
        }

        if(error) return false;
    });



});


function nn_addNoteToWorkbench(iosocket, isNew, data){
    var wrapper = $('#workbench');

    data.note_id = data.note_id || token();
    data.title = data.title || 'neue Notiz';
    data.content = data.content || 'Platz für notizen...';
    data.state = data.state || 1;
    data.pos_x = data.pos_x ||20;
    data.pos_y = data.pos_y || 100;
    data.size_x = data.size_x || 120;
    data.size_y = data.size_y || 160;
    data.z_index = data.z_index || 1;

    var newNote = $('<div class="note ui-widget-content" data-id="'+ data.note_id +'">' +
                '<h5 class="width100p"><input class="width100p notetitle" type="text" value="'+ data.title +'" /></h5>' +
                '<textarea class="width100p notecontent">'+ data.content +'</textarea>' +
            '</div>');

    newNote.css('left', data.pos_x);
    newNote.css('top', data.pos_y);
    newNote.css('width', data.size_x);
    newNote.css('height', data.size_y);
    newNote.css('z-index', data.z_index);

    newNote.resizable({
        minWidth: 120,
        minHeight: 160,
        stop: function( event, ui ) {
            nn_storeNoteCredentials(iosocket, $(this));
            nn_storeNoteContent(iosocket, $(this));
        }
    }).draggable({
        stop: function( event, ui ) {
            nn_storeNoteCredentials(iosocket, $(this));
            nn_storeNoteContent(iosocket, $(this));
        }
    });

    wrapper.append(newNote);

    if(isNew){
        iosocket.emit('store_new_note', { random_id: data.note_id });
    }
}

function nn_updateNodeContent(data){
    var wrapper = $('#workbench');
    var note = wrapper.find('div[data-id='+ data.note_id +']');
    note.find('.notecontent').val(data.content);
    note.find('.notetitle').val(data.title);
}

function nn_storeNoteCredentials(iosocket, note){
    var note_id = note.attr('data-id');
    var data = {
        note_id: note_id,
        pos_x: note.css('left'),
        pos_y: note.css('top'),
        size_x: note.css('width'),
        size_y: note.css('height'),
        z_index: note.css('z-index')
    };

    iosocket.emit('store_notecredentials', data);
}

function nn_storeNoteContent(iosocket, note){
    var note_id = note.attr('data-id');
    var content = note.find('.notecontent').val();
    var title = note.find('.notetitle').val();

    var data = {
        note_id: note_id,
        content: content,
        title: title
    };

    iosocket.emit('store_notecontent', data);
}

function nn_setDbNoteId(data){
    var wrapper = $('#workbench');
    var note = wrapper.find('div[data-id='+ data.random_id +']');
    note.attr('data-id', data.note_id);
}

function nn_respondInvitation(button, iosocket, accept){
    var listitem = button.parent().parent();
    var badge = listitem.parent().parent().find('span[class=badge]');

    var token = listitem.attr('data-token');
    var event = accept? 'accept_friend_invitation' : 'decline_friend_invitation';
    iosocket.emit(event, {token: token});

    if(listitem.siblings('li').length == 1){
        $('#noopeninv').fadeIn();
    }
    listitem.remove();
    nn_decrementbadge(badge);
}

function nn_addFriendEntry(objFriend){
    console.log(objFriend);
    var wrapper = $('#nav_friends');
    var entrylist = wrapper.find('ul');
    var badge = wrapper.find('span[class=badge]');

    if(entrylist.find('li[data-userid='+ objFriend.user_id +']').length){
        return;
    }

    var e = $('<li data-userid="'+ objFriend.user_id +'">' +
            '<div>' +
                '<span>'+ objFriend.name +'</span>' +
            '</div>' +
        '</li>');

    arFriends[objFriend.user_id] = objFriend.name;

    $('#nofriends').hide();
    nn_incrementbadge(badge);
    entrylist.append(e);
}

function nn_addFriendinvitationEntry(objInv){
    var wrapper = $('#nav_friendinvitation');
    var entrylist = wrapper.find('ul');
    var badge = wrapper.find('span[class=badge]');

    if(entrylist.find('li[data-token='+ objInv.token +']').length){
        return;
    }

    // neuen Eintrag erzeugen
    var e = $('<li data-token="'+ objInv.token +'">' +
                '<div>' +
                    '<button type="button" class="stayopen invbutton friendinvaccept btn btn-default btn-xs btn-success glyphicon glyphicon-ok"></button>' +
                    '<button type="button" class="stayopen invbutton friendinvdecline btn btn-default btn-xs btn-danger glyphicon glyphicon-remove"></button>' +
                    '<span>'+ objInv.from +'</span>' +
                '</div>' +
            '</li>');

    $('#noopeninv').hide();

    nn_incrementbadge(badge);
    entrylist.append(e);
}

function nn_incrementbadge(badge){
    var value = badge.html();
    if(value == ''){
        badge.html(1);
    } else {
        value = parseInt(value);
        value += 1;
        badge.html(value);
    }
}

function nn_decrementbadge(badge){
    var value = badge.html();
    if(value == ''){
        return;
    } else {
        value = parseInt(value);
        if(value == 1) {
            badge.html('');
        } else {
            value -= 1;
            badge.html(value);
        }
    }
}

function nn_validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};

