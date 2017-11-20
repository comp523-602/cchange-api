/** @namespace tools/Database */
// Database.js: provides tools for accessing / updating the database

/**
 * Finds a single object in the database using model
 * @memberof tools/Database
 * @param {Object} params
 * @param {Object} params.model Mongoose model object
 * @param {Object} params.query MongoDB query object
 * @param {function (err, object)} callback Callback function
 */
module.exports.findOne = function ({model, query}, callback) {
    model.findOne(query, function (err, object) {
        callback(err, object);
    });
};

/**
 * Finds all objects in the database for a query using model
 * @memberof tools/Database
 * @param {Object} params
 * @param {Object} params.model Mongoose model object
 * @param {Object} params.query MongoDB query object
 * @param {function (err, objects)} callback Callback function
 */
module.exports.find = function ({model, query}, callback) {
    model.find(query, function (err, objects) {
        callback(err, objects);
    });
};

/**
 * Finds a limited, sorted list of objects in the database using model
 * @memberof tools/Database
 * @param {Object} params
 * @param {Object} params.model Mongoose model object
 * @param {Object} params.query MongoDB query object
 * @param {Number} params.pageSize Number of objects needed
 * @param {String} params.sort Object property to sort by
 * @param {function (err, objects)} callback Callback function
 */
module.exports.page = function ({model, query, pageSize, sort, skip}, callback) {
	model.find(query).sort(sort).skip(skip).limit(pageSize).exec(function (err, objects) {
		callback(err, objects);
	});
};

/**
 * Queries and updates an object in the database using model
 * @memberof tools/Database
 * @param {Object} params
 * @param {Object} params.model Mongoose model object
 * @param {Object} params.query MongoDB query object
 * @param {Number} params.update MongoDB update query object
 * @param {function (err, object)} callback Callback function
 */
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