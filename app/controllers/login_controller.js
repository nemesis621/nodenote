var _       = require('lodash');

module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('login', { title: 'Express' });


        },
        execute: function (req, res, next) {
            var params = _.pick(req.body, 'name', 'password');

            req.models.user.find(params, function (err, user) {
                if(user.length == 1){
                    req.session.userid = user[0].id;
                    res.render('index', { title: 'Express', loggedin: true });
                } else {
                    res.render('login', { title: 'Express' });
                }
            });
        }
    }
};