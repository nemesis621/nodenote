var _       = require('lodash');
var settings = require('../../config/settings');


module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('contact');
        },
        execute: function (req, res, next) {
            // nachricht senden
            app.mailer.send('mail_contact', {
//                to: settings.adminmails,
                subject: 'Kontaktanfrage',
                sender: req.body.contact_email,
                content: req.body.contact_msg
            }, function (err) {
                if (err) {
                    // handle error
                    console.log(err);
                    res.render('contact', {error: true, mailvalue: req.body.contact_email, contentvalue: req.body.contact_msg});
                } else {
                    res.render('contact', {success: true});
                }
            });
        }
    }
};