var _       = require('lodash');
var sha1 = require('sha1');

module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('login', { title: 'Express' });
        },
        execute: function (req, res, next) {
            var params = _.pick(req.body, 'email', 'password');
            params.password = sha1(params.password);
            params.active = true;

            req.models.user.find(params, function (err, user) {
                if(user.length == 1){
                    req.session.userid = user[0].user_id;
                    res.cookie('user_id', user[0].user_id);
                    // forward auf home_controller
                    res.redirect('');
                } else {
                    req.session.userid = false;
                    res.clearCookie('user_id');
                    res.render('login', { failed: true });
                }
            });
        },
        logout: function (req, res, next) {
            req.session.userid = false;
            res.clearCookie('user_id');
            res.redirect('');
        }
    }
};