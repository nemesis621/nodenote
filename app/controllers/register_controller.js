module.exports = {
    index: function (req, res, next) {
        res.render('register', { title: 'Express' });
    },
    validate: function (req, res, next) {



        res.render('register', { title: 'Express', success: true });
    }
};