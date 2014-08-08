var _       = require('lodash');
var settings = require('../../config/settings');


module.exports = function(app){
    return {
        index: function (req, res, next) {
            // prüfen ob eingeloggt
            var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
            if(!loggedin){
                res.clearCookie('user_id');
                res.render('usersettings', {loggedin: loggedin});
            } else {
                req.models.user.get(req.session.userid, function (err, user) {
                    console.log(user);

                    var viewparams = {
                        loggedin: loggedin,
                        display_name: user.display_name,
                        first_name: user.first_name,
                        last_name: user.last_name
                    }

                    res.render('usersettings', viewparams);
                });

            }
        },
        execute: function (req, res, next) {

        }
    }
};