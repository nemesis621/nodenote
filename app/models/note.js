var moment = require('moment');

module.exports = function (orm, db) {
    var Note = db.define('note', {
            note_id             : { type: 'serial' },
            content             : { type: 'text', required: true },
            title               : { type: 'text' }
        }, {
            id: 'note_id'
        }
    );
};