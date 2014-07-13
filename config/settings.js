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
    },
    mail         : {
        from: 'noreply@nodenotes.com',
        host: 'mail.ba-leipzig.de', // hostname
//        secureConnection: true, // use SSL
//        port: 587, // port for secure SMTP
        transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
        auth: {
            user: '',
            pass: ''
        }
    }
};

module.exports = settings;