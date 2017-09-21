
// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Charity Properties: configures properties for database object
function CharityProperties (schema) {
    schema.add({

		// Name: name of charity
		'name': {
			'type': String,
			'index': true,
			'required': true,
		},

		// Description: description of charity
		'description': {
			'type': String,
		},

    });
};

// Charity Static Methods: attaches functionality used by the schema in general
function CharityStaticMethods (schema) {

	// Create: creates a new user in the database
	schema.statics.create = function ({name, description}, callback) {

		// Save reference to model
		var Charity = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Charity.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new charity to the database
			function (GUID, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
				var update = {
					'$set': {
						'guid': GUID,
						'name': name,
						'description': description,
					}
				};

				// Make database update
				Database.update({
					'model': Charity,
					'query': query,
					'update': update,
				}, function (err, charity) {
					callback(err, charity);
				});
			},

		], function (err, charity) {
			callback(err, charity);
		});
	};
};

// Charity Instance Methods: attaches functionality related to existing instances of the object
function CharityInstanceMethods (schema) {

};

// Export charityToken model object
module.exports = function () {

	// Make schema for new charity object...
	var charitySchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(charitySchema);

	// Add charity properties and methods to schema
	CharityProperties(charitySchema);
	CharityStaticMethods(charitySchema);
	CharityInstanceMethods(charitySchema);

	// Create new model object with schema
	var charity = Mongoose.model('Charity', charitySchema);

	// Return new model object
	return charity;
}();