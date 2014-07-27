module.exports = function (orm, db) {
    var Friendinvitation = db.define('friendinvitation', {
            inv_id           : { type: 'serial' },
            inv_date         : { type: 'date', required: false, time: true },
            inv_token        : { type: 'text', required: false, time: true }
        }, {
            id: 'inv_id',
            hooks: {
                beforeValidation: function () {
                    this.inv_date = new Date();
                }
            }
        }
    );

    Friendinvitation.hasOne('user', db.models.user, {
        field: 'user_id_src',
        required: true,
        autoFetch: true
    });

    Friendinvitation.hasOne('user', db.models.user, {
        field: 'user_id_dest',
        required: true,
        autoFetch: true
    });
};