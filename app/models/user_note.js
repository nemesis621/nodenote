module.exports = function (orm, db) {
    var user_note = db.define('user_note', {
            user_note_id     : { type: 'serial' },
            state            : { type: 'number'},
            pos_x               : { type: 'number'},
            pos_y               : { type: 'number'},
            size_x              : { type: 'number'},
            size_y              : { type: 'number'},
            z_index             : { type: 'number'}
        }, {
            id: 'user_note_id'
        }
    );

    user_note.hasOne('user', db.models.user, {
        field: 'user_id',
        required: true,
        autoFetch: true
    });

    user_note.hasOne('note', db.models.note, {
        field: 'note_id',
        required: true,
        autoFetch: true
    });
};