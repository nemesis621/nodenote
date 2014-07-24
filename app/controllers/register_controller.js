var _       = require('lodash');
var sha1 = require('sha1');
var moment = require('moment');
var settings = require('../../config/settings');

module.exports = function(app){
    return {
        index: function (req, res, next) {
            var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
            if(!loggedin){
                res.clearCookie('user_id');
            }
            console.log('wurst');
            res.render('register', {loggedin: loggedin});
        },

        validate: function (req, res, next) {
            var viewparams = {};

            var params = _.pick(req.body, 'display_name', 'first_name', 'last_name', 'email', 'password');
            params.registration_token = sha1(moment().format('MMMM Do YYYY, h:mm:ss a'));

            var error = [];

            if(req.body.password != req.body.passwordrpt){
                error.push('password');
            }

            //todo validate email
            if(params.email != ''){
                //todo regulärer ausdrück für mails
                req.models.user.find({'email': params.email}, function (err, user) {
                    if (user.length) {
                        error.push('emailexists');
                    }
                });
            }

            if(!error.length){
                var url = settings.baseurl + '/register/' + params.registration_token;

                req.models.user.create(params, function (err, message) {
                    if(err) {
                        console.log(err);
                        throw new Error('error on creating new user');
                    } else {
                        // token email versenden
                        app.mailer.send('mail_registration', {
                            to: params.email, // REQUIRED. This can be a comma delimited string just like a normal email to field.
                            subject: 'complete registration at nodenotes', // REQUIRED.
                            title: 'complete registration',
                            url: url
                        }, function (err) {
                            if (err) {
                                // handle error
                                console.log(err);
                                return;
                            }
                            viewparams.mail_success = true;
                        });
                        viewparams.reg_success = true;
                    }
                });
            } else {
                viewparams.error = error;
            }
            console.log(viewparams);
            res.render('register', viewparams);
        },
        complete: function (req, res, next) {
            var token =  req.param("token");

            // token validieren -> user auf active = 1 setzen
            req.models.user.find({'registration_token': token}, function (err, user) {
                if (user.length == 1) {
                    user[0].registration_token = '';
                    user[0].active = true;
                    user[0].save(function (err) {
                        if(err){
                            console.log(err);
                        }
                    });

                    req.session.userid = false;
                    res.clearCookie('user_id');
                    res.render('register', {complete: true});
                } else {
                    req.session.userid = false;
                    res.clearCookie('user_id');
                    res.redirect('');
                }
            });
        }
    }
};