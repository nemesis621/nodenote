var sha1 = require('sha1');

module.exports = function (orm, db) {
    var User = db.define('user', {
            user_id             : { type: 'serial' },
            display_name        : { type: 'text', required: true },
            first_name          : { type: 'text', required: true },
            last_name           : { type: 'text', required: true },
            email               : { type: 'text', required: true },
            password            : { type: 'text', required: true },
            photo               : { type: 'binary', required: false },
            registration_date   : { type: 'date', required: false, time: true },
            registration_token  : { type: 'text', required: false },
            active              : { type: 'boolean', required: true, defaultValue: 0 }
        }, {
            id: 'user_id',
            hooks: {
                beforeValidation: function () {
                    this.registration_date = new Date();
                },
                beforeCreate: function (next) {
                    this.password = sha1(this.password);
                    return next();
                }
            }
        }
    );




//    User.hasOne('note', db.models.message, { required: true, reverse: 'comments', autoFetch: true });
};