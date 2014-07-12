var moment = require('moment');

module.exports = function (orm, db) {
    var User = db.define('user', {
            name      : { type: 'text', required: true },
            surname : { type: 'text', required: true },
            age : { type: 'number', required: true }
        });




//    Comment.hasOne('message', db.models.message, { required: true, reverse: 'comments', autoFetch: true });
};