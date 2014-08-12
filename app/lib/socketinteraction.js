var models          = require('../../app/models');
var conUser         = require('../../app/lib/connectedUser');
var socketuserclass = require('../../app/lib/socketuser');
var orm             = require('orm');
var sha1            = require('sha1');
var moment          = require('moment');

module.exports = function(socket){

    socket.on('auth', function (data) {
        var socketuser = new socketuserclass(data.user_id, socket);
        conUser.add(socketuser);

        emitFriends(socketuser);
        emitFriendinvitations(socketuser);
        emitNotes(socketuser);
        emitNoteinvitations(socketuser);
        emitNoteFriendData(socketuser)
    });

    socket.on('store_new_note', function(data){
        models(function (err, db) {
            if (err) throw err;

            var socketuser = conUser.getBySocketId(socket.id);
            if(socketuser){
                // Zettel speichern
                db.models.note.create({title: 'neue Notiz', content: '', state: 1}, function (err, note) {
                    var note_id = note.note_id;

                    // mit Nutzer verknüpfen
                    db.models.user_note.create({user_id: socketuser.user_id, note_id: note_id}, function (err, user_note) {
                        socketuser.socket.emit('response_new_note', {random_id: data.random_id, note_id: note_id});
                    });
                });
            }
        });
    });

    socket.on('store_notecredentials', function(data){
        models(function (err, db) {
            if (err) throw err;
            var noteuser = conUser.getBySocketId(socket.id);
            db.models.user_note.find({user_id: noteuser.user_id, note_id: data.note_id}, function(err, user_note){
                if(user_note.length){
                    user_note[0].pos_x = data.pos_x;
                    user_note[0].pos_y = data.pos_y;
                    user_note[0].size_x = data.size_x;
                    user_note[0].size_y = data.size_y;
                    user_note[0].z_index = data.z_index;
                    user_note[0].color = data.color;
                    user_note[0].save(function(err){});
                }
            });
        });
    });

    socket.on('store_notecontent', function(data){
        models(function (err, db) {
            if (err) throw err;
            var noteuser = conUser.getBySocketId(socket.id);
            db.models.note.find({note_id: data.note_id}, function(err, note){
                if(note.length){
                    note[0].title = data.title;
                    note[0].content = data.content;
                    note[0].save(function(err){});
                    emitNoteChange(noteuser, data);
                }
            });
        });
    });

    socket.on('delete_note', function(data){
        models(function (err, db) {
            if (err) throw err;
            var noteuser = conUser.getBySocketId(socket.id);
            db.models.user_note.find({user_id: noteuser.user_id, note_id: data.note_id}, function(err, user_note){
                if(user_note.length){
                    user_note[0].remove(function (err) {
                        // Note Löschen wenn keine weiteren Verknüpfungen
                        db.models.user_note.find({note_id: data.note_id}, function(err, user_note){
                            if(!user_note.length){
                                db.models.note.find({note_id: data.note_id}, function(err, note){
                                    if(note.length){
                                        note[0].remove(function (err) {});
                                    }
                                })
                            }
                        })
                    });
                }
            });
        });
    });

    socket.on('accept_friend_invitation', function (data) {
        models(function (err, db) {
            if (err) throw err;

            db.models.friendinvitation.find({inv_token: data.token}, function(err, invitation){
                if(invitation.length){
                    var friendparams = {
                        user_id: invitation[0].user_id_src,
                        user_friend_id: invitation[0].user_id_dest
                    }

                    var friendparams_invert = {
                        user_id: invitation[0].user_id_dest,
                        user_friend_id: invitation[0].user_id_src
                    }

                    db.models.friend.create(friendparams, function (err, message) {
                        db.models.friend.create(friendparams_invert, function (err, message) {
                            var destUser = conUser.getByUserId(friendparams.user_id);
                            if(destUser){
                                emitFriends(destUser);
                            }
                            var srcUser = conUser.getByUserId(friendparams.user_friend_id);
                            if(srcUser){
                                emitFriends(srcUser);
                            }
                            invitation[0].remove(function (err) {});
                        });
                    });
                }
            });
        });
    });

    socket.on('decline_friend_invitation', function (data) {
        models(function (err, db) {
            if (err) throw err;
            db.models.friendinvitation.find({inv_token: data.token}, function (err, invitation) {
                if(invitation.length){
                    invitation[0].remove(function (err) {});
                }
            });
        });
    });

    socket.on('accept_note_invitation', function (data) {
        models(function (err, db) {
            if (err) throw err;
            db.models.noteinvitation.find({noteinv_token: data.token}, function(err, invitation) {
                if (invitation.length) {
                    var user_note_data = {
                        user_id: invitation[0].user_id_dest,
                        note_id: invitation[0].note_id
                    };
                    db.models.user_note.create(user_note_data, function(err, user_note){
                        var destUser = conUser.getByUserId(user_note_data.user_id);
                        if(destUser){
                            emitNotes(destUser);
                        }
                        invitation[0].remove(function (err) {});
                    });
                }
            });
        });
    });

    socket.on('decline_note_invitation', function (data) {
        models(function (err, db) {
            if (err) throw err;
            db.models.noteinvitation.find({noteinv_token: data.token}, function (err, invitation) {
                if(invitation.length){
                    invitation[0].remove(function (err) {});
                }
            });
        });
    });

    socket.on('note_invitation', function (data) {
        models(function (err, db) {
            if (err) throw err;
            var srcUser = conUser.getBySocketId(socket.id);

            // ist bereits note zugeordnet
            db.models.user_note.exists({ user_id: data.friend_id, note_id: data.note_id}, function (err, exists) {
                if(!exists){
                    // wurde bereits eingeladen
                    db.models.noteinvitation.exists({ user_id_dest: data.friend_id, note_id: data.note_id}, function (err, exists) {
                        if(!exists){
                            // wurde bereits eingeladen
                            var invparams = {
                                noteinv_token: sha1(moment().format('MMMM Do YYYY, h:mm:ss a')),
                                user_id_src: srcUser.user_id,
                                user_id_dest: data.friend_id,
                                note_id: data.note_id
                            };
                            db.models.noteinvitation.create(invparams, function(){

                                // zielnutzer benachrichtigen
                                var targetuser = conUser.getByUserId(data.friend_id);
                                if(targetuser) {
                                    db.models.note.get(data.note_id, function(err, tarnote){
                                        var note_title = tarnote.title;
                                        db.models.user.get(srcUser.user_id, function(err, srcuser){
                                            targetuser.socket.emit('new_note_invitation', {from: srcuser.display_name, title: note_title, token: invparams.noteinv_token});
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });


    socket.on('friend_invitation', function (msg) {
        models(function (err, db) {
            if (err) throw err;

            db.models.user.find({email: msg.email}, function (err, user) {
                //ziel user_id ermitteln
                if(user.length){
                    var params = {
                        user_id_src: msg.user_id,
                        user_id_dest: user[0].user_id
                    }

                    //einladung an eigene adresse?
                    if(params.user_id_src == params.user_id_dest){
                        socket.emit('friend_invitation_response', {status: false, errmsg: 'Sie können sich nicht selber einladen!'});
                        return;
                    }

                    // einladung bereits vorhanden?
                    var finccondition = {or:[params, {user_id_src: params.user_id_dest, user_id_dest: params.user_id_src}]};
                    db.models.friendinvitation.find(finccondition, function (err, invitation) {
                        if(invitation.length){
                            socket.emit('friend_invitation_response', {status: false, errmsg: 'Eine derartige Einladung existiert bereits.'});
                            return;
                        } else {
                            // bereits freunde?
                            db.models.friend.find({user_id: params.user_id_src, user_friend_id: params.user_id_dest}, function (err, friendship) {
                                if(friendship.length){
                                    socket.emit('friend_invitation_response', {status: false, errmsg: 'Sie sind bereits mit diesem Nutzer befreundet.'});
                                } else {
                                    var token = sha1(moment().format('MMMM Do YYYY, h:mm:ss a'));
                                    params.inv_token = token;
                                    db.models.friendinvitation.create(params, function(){
                                        socket.emit('friend_invitation_response', {status: true});
                                        // zielnutzer benachrichtigen
                                        var targetuser = conUser.getByUserId(params.user_id_dest);
                                        if(targetuser) {
                                            db.models.user.get(params.user_id_src, function(err, srcuser){
                                                targetuser.socket.emit('new_friend_invitation', {from: srcuser.display_name, token:token});
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    // Nutzer nicht gefunden
                    socket.emit('friend_invitation_response', {status: false, errmsg: 'Nutzer nicht gefunden.'});
                }
            });
        });
    });

    socket.on('message', function (msg) {
        console.log(msg);
    });

    socket.on('disconnect', function () {
        conUser.removeBySocketId(socket.id);

        // freund geh offline ... 3 x in intervallen prüfen (alle 2 / 3 sekunden) wenn immer offline dann freunde benachrichtigen
    });
}


function emitNoteChange(socketuser, data){
    models(function (err, db) {
        if (err) throw err;
        var params = {note_id: data.note_id, user_id: orm.ne(socketuser.user_id)};
        db.models.user_note.find(params, function(err, user_note){
            for(var i = 0; i < user_note.length; i++){
                var emituser = conUser.getByUserId(user_note[i].user_id);
                emituser.socket.emit('note_content_change', data);
            }
        });
    });
}

function emitFriends(socketuser){
    models(function (err, db) {
        if (err) throw err;

        db.models.friend.find({user_id: socketuser.user_id}, function (err, friends) {
            for (var i = 0; i < friends.length; i++) {
                socketuser.socket.emit('new_friend', {
                    user_id: friends[i].user_friend.user_id,
                    name: friends[i].user_friend.display_name
                });
            }
        });
    });
}

function emitFriendinvitations(socketuser){
    models(function (err, db) {
        if (err) throw err;

        db.models.friendinvitation.find({user_id_dest: socketuser.user_id}, function(err, friendinvitation){
            for(var i = 0; i < friendinvitation.length; i++){
                socketuser.socket.emit('new_friend_invitation', {
                    token: friendinvitation[i].inv_token,
                    from: friendinvitation[i].user_src.display_name
                });
            }
        });
    });
}

function emitNotes(socketuser){
    models(function (err, db) {
        if (err) throw err;
        db.models.user_note.find({user_id: socketuser.user_id}, function(err, user_note){
            for(var i = 0; i < user_note.length; i++){
                socketuser.socket.emit('new_note', {
                    note_id: user_note[i].note_id,
                    state: user_note[i].state,
                    pos_x: user_note[i].pos_x,
                    pos_y: user_note[i].pos_y,
                    size_x: user_note[i].size_x,
                    size_y: user_note[i].size_y,
                    z_index: user_note[i].z_index,
                    color: user_note[i].color,
                    title: user_note[i].note.title,
                    content: user_note[i].note.content
                });
            }
        });
    });
}

function emitNoteinvitations(socketuser){
    models(function (err, db) {
        if (err) throw err;

        db.models.noteinvitation.find({user_id_dest: socketuser.user_id}, function(err, noteinvitation){
            for(var i = 0; i < noteinvitation.length; i++){
                socketuser.socket.emit('new_note_invitation', {
                    token: noteinvitation[i].noteinv_token,
                    title: noteinvitation[i].note.title,
                    from: noteinvitation[i].user_src.display_name
                });
            }
        });
    });
}

function emitNoteFriendData(socketuser){

    var data = {
//        1: {
//            shared: {
//                2: 'Tony',
//                3: 'Kartoffel'
//            },
//            open: {
//                4: 'Kevin',
//                5: 'Alex',
//                6: 'Paul'
//            },
//            invitable: {
//                7: 'Horst',
//                8: 'Martin'
//            }
//        }
    };

    models(function (err, db) {
        if (err) throw err;

        db.models.user_note.find({user_id: socketuser.user_id}, function(err, user_note){

            for(var i = 0; i < user_note.length; i++){
                data[user_note[i].note_id] = {
                    shared: {},
                    open: {},
                    invitable: {}
                };

                // geteilt
                db.models.user_note.find({note_id: user_note[i].note_id, user_id: orm.ne(socketuser.user_id)}, function(err, friend_note){

                    for(var k = 0; k < friend_note.length; k++){
                        data[friend_note[k].note_id].shared[friend_note[k].user_id] = friend_note[k].user.display_name;
                    }

                    socketuser.socket.emit('update_note_friend_data', {note_id: 1, data: data[1]});


                    // offene Einladungen
//                    db.models.noteinvitation.find({note_id: user_note[i].note_id, user_id_dest: orm.ne(socketuser.user_id)}, function(err, friend_note){
//
//                    });
                });




////                console.log(user.user_note[i].note);
            }
        });

    });




}