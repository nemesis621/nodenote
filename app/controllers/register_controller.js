var _       = require('lodash');

module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('register', { title: 'Express' });
        },

        validate: function (req, res, next) {
            var params = _.pick(req.body, 'name', 'email', 'password');

            req.models.user.create(params, function (err, message) {
                if(err) {
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

        }
    }
};