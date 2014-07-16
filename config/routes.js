var controllers = require('../app/controllers/index')

module.exports = function (app) {
    app.get('/'                         , controllers.home.index);
    app.get('/register'                 , controllers.register(app).index);
    app.post('/register'                , controllers.register(app).validate);
    app.get('/register/:token'          , controllers.register(app).complete);
    app.get('/login'                    , controllers.login(app).index);
    app.post('/login'                   , controllers.login(app).execute);

//    app.get( '/messages'                   , controllers.messages.list);
//    app.post('/messages'                   , controllers.messages.create);
//    app.get( '/message/:id'                , controllers.messages.get);
//    app.post('/message/:messageId/comments', controllers.comments.create);
};