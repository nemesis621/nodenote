var moment = require('moment');

module.exports = function (orm, db) {
    var User = db.define('user', {
            name      : { type: 'text', required: true },
//            surname : { type: 'text', required: true },
            email : { type: 'text', required: true },
            password : { type: 'text', required: true }
//            token : { type: 'text', required: true },
//            aktive : { type: 'boolean', required: true }
        });




//    Comment.hasOne('message', db.models.message, { required: true, reverse: 'comments', autoFetch: true });
};