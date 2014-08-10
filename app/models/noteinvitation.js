module.exports = function (orm, db) {
    var Noteinvitation = db.define('noteinvitation', {
            noteinv_id           : { type: 'serial' },
            noteinv_date         : { type: 'date', required: false, time: true },
            noteinv_token        : { type: 'text', required: false, time: true }
        }, {
            id: 'noteinv_id',
            hooks: {
                beforeValidation: function () {
                    this.noteinv_date = new Date();
                }
            }
        }
    );

    Noteinvitation.hasOne('user_src', db.models.user, {
        field: 'user_id_src',
        required: true,
        autoFetch: true
    });

    Noteinvitation.hasOne('user_dest', db.models.user, {
        field: 'user_id_dest',
        required: true,
        autoFetch: true
    });

    Noteinvitation.hasOne('note', db.models.note, {
        field: 'note_id',
        required: true,
        autoFetch: true
    });
};