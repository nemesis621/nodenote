var controllers = require('../app/controllers/index')

module.exports = function (app) {
    app.get('/'                         , controllers.home.index);
    app.get('/login'                    , controllers.openid(app).index);
    app.get('/authenticate'             , controllers.openid(app).authenticate);
    app.get('/verify'                   , controllers.openid(app).verify);

    app.get('/logout'                   , controllers.login(app).logout);
    app.get('/contact'                  , controllers.contact(app).index);
    app.post('/contact'                 , controllers.contact(app).execute);
    app.get('/about'                    , controllers.about(app).index);
    app.get('/privacy'                  , controllers.privacy(app).index);



};