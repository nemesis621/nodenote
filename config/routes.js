var controllers = require('../app/controllers/index')

module.exports = function (app) {
    app.get('/'                         , controllers.home.index);
    app.get('/register'                 , controllers.register.index);
    app.post('/register'                , controllers.register.validate);

//    app.get( '/messages'                   , controllers.messages.list);
//    app.post('/messages'                   , controllers.messages.create);
//    app.get( '/message/:id'                , controllers.messages.get);
//    app.post('/message/:messageId/comments', controllers.comments.create);
};