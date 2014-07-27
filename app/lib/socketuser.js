var models      = require('../../app/models');

var socketuser = function(user_id, socket){
    this.user_id = user_id;
    this.socket = socket;


    models(function (err, db) {
        if (err) throw err;
        db.models.user.get(user_id, function (err, user) {
            this.db = user;
        });
    });

    this.invite = function(){

    }
}


module.exports = socketuser;
