
// Find One
module.exports.findOne({model, query}, callback) {
    model.findOne(query).exec(function(err, obj) {
        callback(err, obj);
    });
};