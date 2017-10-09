/** @namespace model/User */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// User Properties: configures properties for database object
function UserProperties (schema) {
    schema.add({

		// Name: the user's name
		'name': {
			'type': String,
			'required': true
		},

		// Email: the user's email (used for user uniqueness)
		'email': {
			'type': String,
			'unique': true,
			'index': true,
			'lowercase': true,
			'required': true,
		},

		// Password: hashed password string
		'password': {
			'type': String,
			'required': true
		},

		// Charity: GUID of charity which user belongs to, used to distinguish user types
		'charity': {
			'type': String,
			'default': null,
		},

    });
};

// User Static Methods: attaches functionality used by the schema in general
function UserStaticMethods (schema) {

	/**
	 * Creates a new user in the database
	 * @memberof model/User
	 */
	schema.statics.create = function ({name, email, password, charityGUID}, callback) {

		// Save reference to model
		var User = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				User.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new user to the database
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
						'email': email,
						'password': password,
						'charity': charityGUID,
						'dateCreated': Dates.now(),
					}
				};

				// Make database update
				Database.update({
					'model': User,
					'query': query,
					'update': update,
				}, function (err, user) {
					callback(err, user);
				});
			},

		], function (err, user) {
			callback(err, user);
		});
	};
};

// User Instance Methods: attaches functionality related to existing instances of the object
function UserInstanceMethods (schema) {

};

// Export user model object
module.exports = function () {

	// Make schema for new user object...
	var userSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(userSchema);

	// Add user properties and methods to schema
	UserProperties(userSchema);
	UserStaticMethods(userSchema);
	UserInstanceMethods(userSchema);

	// Create new model object with schema
	var user = Mongoose.model('User', userSchema);

	// Return new model object
	return user;
}();