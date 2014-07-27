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
            // load notes
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
                friendparams.user_id = friends[i].user_friend_id;
                db.models.user.get(friendparams.user_id, function (err, user) {
                    friendparams.name = user.display_name;
                    socketuser.socket.emit('new_friend', friendparams);
                });
            }
        });
    });
}

function emitFriendinvitations(socketuser){
    models(function (err, db) {
        if (err) throw err;

        var friendinv_params = {}

        db.models.friendinvitation.find({user_id_dest: socketuser.user_id}, function(err, friendinvitation){
            for(var i = 0; i < friendinvitation.length; i++){
                friendinv_params.token =  friendinvitation[i].inv_token;
                db.models.user.get(friendinvitation[i].user_id_src, function(err, invuser){
                    if(invuser){
                        friendinv_params.from = invuser.display_name;
                        socketuser.socket.emit('new_friend_invitation', friendinv_params);
                    }
                });
            }
        });
    });
}