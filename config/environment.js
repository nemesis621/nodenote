var path     = require('path');
var express  = require('express');
var favicon  = require('static-favicon');
var mailer   = require('express-mailer');

var settings = require('./settings');
var models   = require('../app/models/index');

module.exports = function (app) {

    app.configure(function () {

        // view engine setup
        app.set('views', path.join(settings.path, '/app/views'));
        app.set('view engine', 'jade');

        app.use(express.static(path.join(settings.path, 'public')));
        app.use(express.logger({ format: 'dev' }));
        app.use(express.favicon());
        app.use(express.bodyParser());
        app.use(express.methodOverride());

        app.use(express.cookieParser());
        app.use(express.session({secret: 'mightyplow'}));

        app.use(function (req, res, next) {
            models(function (err, db) {
                if (err) return next(err);
                req.models = db.models;
                req.db     = db;
                return next();
            });
        }),
        app.use(app.router);

        mailer.extend(app, settings.mail);
    });
};