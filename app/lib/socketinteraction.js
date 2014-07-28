var models          = require('../../app/models');
var conUser         = require('../../app/lib/connectedUser');
var socketuserclass = require('../../app/lib/socketuser');

var sha1        = require('sha1');
var moment      = require('moment');

module.exports = function(socket){

    socket.on('auth', function (data) {
        var socketuser = new socketuserclass(data.user_id, socket);
        conUser.add(socketuser);

        emitFriends(socketuser);
        emitFriendinvitations(socketuser);
            // load noteinvitations
        emitNotes(socketuser);
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



function emitFriends(socketuser){
    models(function (err, db) {
        if (err) throw err;
        var friendparams = {};
        db.models.friend.find({user_id: socketuser.user_id}, function (err, friends) {
            for (var i = 0; i < friends.length; i++) {
                friendparams[friends[i].user_friend_id] = {
                    user_id: friends[i].user_friend_id
                };
                db.models.user.get(friends[i].user_friend_id, function (err, user) {
                    if(user){
                        friendparams[user.user_id].name = user.display_name;
                        socketuser.socket.emit('new_friend', friendparams[user.user_id]);
                    }
                });
            }
        });
    });
}

function emitFriendinvitations(socketuser){
    models(function (err, db) {
        if (err) throw err;

        var friendinv_params = {};
        db.models.friendinvitation.find({user_id_dest: socketuser.user_id}, function(err, friendinvitation){
            for(var i = 0; i < friendinvitation.length; i++){

                friendinv_params[friendinvitation[i].user_id_src] = {
                    token: friendinvitation[i].inv_token
                };

                db.models.user.get(friendinvitation[i].user_id_src, function(err, invuser){
                    if(invuser){
                        friendinv_params[invuser.user_id].from = invuser.display_name;
                        socketuser.socket.emit('new_friend_invitation', friendinv_params[invuser.user_id]);
                    }
                });
            }
        });
    });
}

function emitNotes(socketuser){
    models(function (err, db) {
        if (err) throw err;

        var noteData = {};
        db.models.user_note.find({user_id: socketuser.user_id}, function(err, user_note){
            for(var i = 0; i < user_note.length; i++){
                noteData[user_note[i].note_id] = {
                    note_id: user_note[i].note_id,
                    state: user_note[i].state,
                    pos_x: user_note[i].pos_x,
                    pos_y: user_note[i].pos_y,
                    size_x: user_note[i].size_x,
                    size_y: user_note[i].size_y,
                    z_index: user_note[i].z_index
                };

                db.models.note.find({note_id: user_note[i].note_id}, function(err, note){
                    if(note.length) {
                        noteData[note[0].note_id].title = note[0].title;
                        noteData[note[0].note_id].content = note[0].content;
                        socketuser.socket.emit('new_note', noteData[note[0].note_id]);
                    }
                });
            }
        });
    });
}