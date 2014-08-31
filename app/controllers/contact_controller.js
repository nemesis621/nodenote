var _       = require('lodash');
var settings = require('../../config/settings');


module.exports = function(app){
    return {
        index: function (req, res, next) {
            // prüfen ob eingeloggt
            var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
            if(!loggedin){
                res.clearCookie('user_id');
            }
            res.render('contact', {loggedin: loggedin});
        },
        execute: function (req, res, next) {
            // prüfen ob eingeloggt
            var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
            if(!loggedin){
                res.clearCookie('user_id');
            }

            // nachricht senden
            app.mailer.send('mail_contact', {
                to: settings.adminmails,
                subject: 'Kontaktanfrage',
                sender: req.body.contact_email,
                content: req.body.contact_msg
            }, function (err) {
                if (err) {
                    // handle error
                    console.log(err);
                    res.render('contact', {error: true, mailvalue: req.body.contact_email, contentvalue: req.body.contact_msg, loggedin: loggedin});
                } else {
                    res.render('contact', {success: true, loggedin: loggedin});
                }
            });
        }
    }
};