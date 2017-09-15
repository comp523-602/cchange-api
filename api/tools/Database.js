
// Find One: finds a single object in the database
module.exports.findOne = function ({model, query}, callback) {

	// Find object with Mongoose
    model.findOne(query, function (err, object) {
        callback(err, object);
    });
};

// Update: queries and updates an object in the database
module.exports.update = function ({model, query, update}, callback) {

	// Setup options
	var options = {
		'setDefaultsOnInsert': true, // Adds default properties to database object
		'runValidators': true, // Allows mongoDB to validate update
		'new': true, // Returns the modified document
		'upsert': true, // If a document isn't found, make one based on query
	};

	// Setup query
	if (!update.$set) update.$set = {}; // Make a set operation if one isn't defined in the update
	if (!update.$setOnInsert) update.$setOnInsert = {}; // Make a setOnInsert operation if one isn't defined in the update

	// Make query and update with Mongoose
	model.findOneAndUpdate(query, update, options, function (err, object) {
		callback(err, object);
	});
};