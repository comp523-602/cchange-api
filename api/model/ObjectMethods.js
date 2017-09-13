
// Initialize dependencies
// const Uuid = require('uuid');
// const Database = require('./../tools/Database.js');

// Static Methods (functionality attached to the schema in general)
function ObjectStaticMethods (schema) {

	// GUID: returns a unique GUID
	schema.statics.GUID = function GUID(callback) {

		// // Save reference to model object
		// var model = this;
		//
		// // Generate a new GUID
		// var GUID = Uuid.v4();
		//
		// // Build query to check for uniqueness
		// var query = {
		// 	"guid": GUID
		// };
		//
		// // Check for uniqueness
		// Database.findOneObjectInModel(model, query, function(err, object) {
		//
		// 	// If an object exists, recursively make another GUID.
		// 	if (object) {
		// 		return model.GUID(callback);
		// 	}
		//
		// 	// Otherwise, return GUID
		// 	return callback(err, GUID);
		// });
	}

};

// Instance Methods (functionality related to existing instances of the schema
function ObjectInstanceMethods (schema) {



};

// Object Methods: adds methods to a schema
module.exports = function (schema) {
	ObjectStaticMethods(schema);
	ObjectInstanceMethods(schema);
}