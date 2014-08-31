var _       = require('lodash');
var sha1 = require('sha1');

var openid = require('openid');
var url = require('url');
var querystring = require('querystring');
var settings = require('../../config/settings');

var extensions = [new openid.UserInterface(),
    new openid.SimpleRegistration(
        {
            "nickname" : true,
            "email" : true,
            "fullname" : true,
            "dob" : true,
            "gender" : true,
            "postcode" : true,
            "country" : true,
            "language" : true,
            "timezone" : true
        }),
    new openid.AttributeExchange(
        {
            "http://axschema.org/contact/email": "required",
            "http://axschema.org/namePerson/friendly": "required",
            "http://axschema.org/namePerson": "required"
        }),
    new openid.PAPE(
        {
            "max_auth_age": 24 * 60 * 60, // one day
            "preferred_auth_policies" : "none" //no auth method preferred.
        })];

var relyingParty = new openid.RelyingParty(
    settings.baseurl + '/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    extensions); // List of extensions to enable and include

//https://www.google.com/accounts/o8/id

module.exports = function(app){
    return {
        index: function (req, res, next) {
            var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
            if(!loggedin){
                res.clearCookie('user_id');
                res.render('login', { loggedin: loggedin });
            } else {
                res.redirect('');
            }
        },
        authenticate: function (req, res, next) {
            // User supplied identifier
            var parsedUrl = url.parse(req.url);
            var query = querystring.parse(parsedUrl.query);
            var identifier = query.openid_identifier;
            // Resolve identifier, associate, and build authentication URL
            relyingParty.authenticate(identifier, false, function(error, authUrl){
                if(error || !authUrl) {
                    res.render('login', { loggedin: false, error: true });
                } else {
                    // Zum Provider-Login weiterleiten
                    res.writeHead(302, { Location: authUrl });
                    res.end();
                }
            });
        },
        verify: function (req, res, next) {
            relyingParty.verifyAssertion(req, function(error, result){
                if(error){
                    res.render('login', { loggedin: false, error: true });
                } else {
                    // Einloggen erfolgreich
                    req.models.user.find({'email': result.email}, function (err, user) {
                        if (user.length) {
                            req.session.userid = user[0].user_id;
                            req.session.display_name = user[0].display_name;
                            res.cookie('user_id', user[0].user_id);
                            res.redirect('');
                        } else {
                            var UserParams = {
                                display_name: result.email,
                                email: result.email
                            };

                            req.models.user.create(UserParams, function (err, user) {
                                if(err){
                                    res.render('login', { loggedin: false, error: true });
                                }
                                req.session.userid = user.user_id;
                                req.session.display_name = user.display_name;
                                res.cookie('user_id', user.user_id);
                                res.redirect('');
                            });
                        }
                    });
                }
            });
        }
    }
};