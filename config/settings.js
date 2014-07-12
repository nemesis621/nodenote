var path = require('path');

var settings = {
    path       : path.normalize(path.join(__dirname, '..')),
    port       : 3000,
    database   : {
        protocol : "mysql",
        query    : { pool: true },
        host     : "127.0.0.1",
        database : "",
        user     : "",
        password : ""
    }
};

module.exports = settings;