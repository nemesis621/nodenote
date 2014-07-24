module.exports = {
    index: function (req, res, next) {

        // prüfen ob eingeloggt
        var loggedin = (typeof(req.session.userid) !== 'undefined') && req.session.userid;
        if(!loggedin){
            res.clearCookie('user_id');
        }
        res.render('index', { title: 'NodeNotes', loggedin: loggedin});
    }
};