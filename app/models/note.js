var moment = require('moment');

module.exports = function (orm, db) {
    var Note = db.define('note', {
            body      : { type: 'text', required: true },
            title : { type: 'text', required: true }
        });
};