var models = require('../app/models/index');

models(function (err, db) {
    if (err) throw err;
    db.drop(function (err) {
        if (err) throw err;
        db.sync(function (err) {
            if (err) throw err;
            console.log('sync complete');
        });
    });
});