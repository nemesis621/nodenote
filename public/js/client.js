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

            document.on('click', '.deleteNote_button', function(e){
                var note_id = $(e.target).parents('.note').attr('data-id');
                $(".deletenote-modal-sm .deletenote_confirm").attr('data-id', note_id);
                $('.deletenote-modal-sm').modal('show');
            });

            $('.deletenote_confirm').click(function(){
                var note_id = $(this).attr('data-id');
                iosocket.emit('delete_note', {note_id: note_id})

                $('.note[data-id='+ note_id +']').remove();
            });

            document.on('click', '.friendinvaccept', function(){
                nn_respondInvitation($(this), iosocket, true);
            });

            document.on('click', '.friendinvdecline', function(){
                nn_respondInvitation($(this), iosocket, false);
            });

            document.on('focusout', '.notecontent', function(){
                nn_storeNoteContent(iosocket, $(this).parents('.note'));
            });

            document.on('focusout', '.notetitle', function(){
                nn_storeNoteContent(iosocket, $(this).parents('.note'));
            });

            // Dynamischer Content für FriendPopover (Notes)
            document.on('show.bs.popover', '.friendpopover', function(){
                var content = nn_getNoteFriendPopoverContent($(this).parents('.note'));
                $(this).data("bs.popover").options.content= content;
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



    document.on('click', '.dropdown-menu .stayopen', function(e){
        e.stopPropagation();
    });

    $('body').on('click', function (e) {
        $('.friendpopover').each(function () {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
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
    var minwidth = 220;
    var minheight = 200;

    data.note_id = data.note_id || token();
    data.title = data.title || 'neue Notiz';
    data.content = data.content || 'Platz für notizen...';
    data.state = data.state || 1;
    data.pos_x = data.pos_x ||20;
    data.pos_y = data.pos_y || 100;
    data.size_x = data.size_x || minheight;
    data.size_y = data.size_y || minwidth;
    data.z_index = data.z_index || 10;
    data.color = data.color || '#FFFFFF';

    var newNote = $('<div class="note ui-widget-content" data-id="'+ data.note_id +'">' +
                '<div class="noteheader">' +
                    '<div class="notebuttons">' +
                        '<button type="button" class="notedraghandler btn btn-default btn-xs">' +
                            '<span class="glyphicon glyphicon-fullscreen"></span>' +
                        '</button>' +
                    '</div>' +
                    '<div class="noteheadline">' +
                        '<input class="notetitle" type="text" value="'+ data.title +'" />' +
                    '</div>' +
                '</div>' +
                '<textarea class="width100p notecontent">'+ data.content +'</textarea>' +
                '<div class="notefooter">' +
                    '<div class="notebuttons">' +
                        '<button type="button" class="btn btn-default btn-xs">' +
                            '<span class="glyphicon glyphicon-tint"></span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-default btn-xs">' +
                            '<span class="glyphicon glyphicon-upload"></span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-default btn-xs">' +
                            '<span class="glyphicon glyphicon-download"></span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-default btn-xs friendpopover">' +
                            '<span class="glyphicon glyphicon-user"></span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-default btn-xs deleteNote_button">' +
                            '<span class="glyphicon glyphicon-trash"></span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>');

    newNote.css('left', data.pos_x);
    newNote.css('top', data.pos_y);
    newNote.css('width', data.size_x);
    newNote.css('height', data.size_y);
    newNote.css('z-index', data.z_index);
    newNote.css('background-color', data.color);

    newNote.find('.friendpopover').popover({
        html: true,
        content: ' ',
        placement: 'top'
    });

    newNote.resizable({
        minWidth: minwidth,
        minHeight: minheight,
        stop: function( event, ui ) {
            nn_storeNoteCredentials(iosocket, $(this));
        }
    }).draggable({
        handle: '.notedraghandler',
        cancel: '',
        scroll: false,
        stop: function( event, ui ) {
            nn_storeNoteCredentials(iosocket, $(this));
        }
    });

    wrapper.append(newNote);

    if(isNew){
        iosocket.emit('store_new_note', { random_id: data.note_id });
    }
}

function nn_getNoteFriendPopoverContent(note){
    // liste aller freunde zum einladen

    // liste aller freunde die bereits teilen


    return 'freunde ...';
//    console.log(elem);
//    var note = elem.parents('.note');
//    return note.html();
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
        z_index: note.css('z-index'),
        color: note.css('background-color')
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

