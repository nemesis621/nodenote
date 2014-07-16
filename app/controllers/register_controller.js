var _       = require('lodash');
var sha1 = require('sha1');
var moment = require('moment');
var settings = require('../../config/settings');

module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('register', { title: 'Express' });
        },

        validate: function (req, res, next) {
            var params = _.pick(req.body, 'display_name', 'first_name', 'last_name', 'email', 'password');
            params.registration_token = sha1(moment().format('MMMM Do YYYY, h:mm:ss a'));

            var url = settings.baseurl + '/register/' + params.registration_token;
            console.log(url);


            req.models.user.create(params, function (err, message) {
                if(err) {
                    console.log(err);
                    throw new Error('Oh oh, an error has occured');
                } else {
                    res.render('register', { title: 'Express', success: true });
                }
            });




//            app.mailer.send('index', {
//                to: 'nemesis621@gmx.net', // REQUIRED. This can be a comma delimited string just like a normal email to field.
//                subject: 'Test Email', // REQUIRED.
//                title: 'test',
//                otherProperty: 'Other Property' // All additional properties are also passed to the template as local variables.
//            }, function (err) {
//                if (err) {
//                    // handle error
//                    console.log(err);
//                    res.send('There was an error sending the email');
//                    return;
//                }
//                res.render('register', { title: 'Express', success: true });
//            });

        },
        complete: function (req, res, next) {
            var token =  req.param("token");

            // token validieren -> user auf active = 1 setzen

            res.render('register', { title: 'Express', complete: true });
        }
    }
};