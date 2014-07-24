module.exports = function(app){
    return {
        index: function (req, res, next) {
            res.render('about');
        }
    }
};