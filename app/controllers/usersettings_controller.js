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

            res.render('usersettings', {loggedin: loggedin});
        },
        execute: function (req, res, next) {

        }
    }
};