var controllers = require('../app/controllers/index')

module.exports = function (app) {
    app.get('/'                         , controllers.home.index);
    app.get('/register'                 , controllers.register(app).index);
    app.post('/register'                , controllers.register(app).validate);
    app.get('/register/:token'          , controllers.register(app).complete);
    app.get('/login'                    , controllers.login(app).index);
    app.post('/login'                   , controllers.login(app).execute);
    app.get('/logout'                   , controllers.login(app).logout);
    app.get('/contact'                  , controllers.contact(app).index);
    app.post('/contact'                 , controllers.contact(app).execute);
    app.get('/about'                    , controllers.about(app).index);
    app.get('/privacy'                  , controllers.privacy(app).index);
    app.get('/usersettings'             , controllers.usersettings(app).index);

};