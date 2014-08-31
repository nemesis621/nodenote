var sha1 = require('sha1');

module.exports = function (orm, db) {
    var User = db.define('user', {
            user_id             : { type: 'serial' },
            display_name        : { type: 'text', required: true },
            email               : { type: 'text', required: true },
            registration_date   : { type: 'date', required: false, time: true }
        }, {
            id: 'user_id',
            hooks: {
                beforeValidation: function () {
                    this.registration_date = new Date();
                }
            }
        }
    );
};