module.exports = function (orm, db) {
    var Friend = db.define('friend', {
            friend_id        : { type: 'serial' }
        }, {
            id: 'friend_id'
        }
    );

    Friend.hasOne('user', db.models.user, {
        field: 'user_id',
        required: true,
        autoFetch: true
    });

    Friend.hasOne('user_friend', db.models.user, {
        field: 'user_friend_id',
        required: true,
        autoFetch: true
    });
};