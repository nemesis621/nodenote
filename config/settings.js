var path = require('path');

var settings = {
    path       : path.normalize(path.join(__dirname, '..')),
    port       : 3000,
    database   : {
        protocol : "mysql",
        query    : { pool: true },
        host     : "127.0.0.1",
        database : "notes",
        user     : "root",
        password : ""
    }
};

module.exports = settings;