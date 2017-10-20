/** @namespace model/Update */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

/**
 * Checks if authenticated user can edit update
 * @memberof model/Update
 * @param {Object} update Update object
 * @param {Object} token Decoded token object
 * @return {Boolean} True if user can edit update
 */
function authenticatedToken (update, token) {
	if (token.charity == update.charity) return true;
	return false;
};

// Update Properties: configures properties for database object
function UpdateProperties (schema) {
    schema.add({

		// Charity: GUID of the charity this update belongs to
		'charity': {
			'type': String,
			'required': true,
		},

		// Name: name of update
		'name': {
			'type': String,
			'index': true,
			'required': true,
		},

		// Description: description of update
		'description': {
			'type': String,
			'default': "",
		},

    });
};

// Update Static Methods: attaches functionality used by the schema in general
function UpdateStaticMethods (schema) {

	/**
	 * Creates a new update in the database
	 * @memberof model/Update
	 * @param {Object} params
	 * @param {String} params.name Name of update
	 * @param {String} [params.description] Update description
	 * @param {Object} params.charity Charity object associated with update
	 * @param {function(err, update)} callback Callback function
	 */
	schema.statics.create = function ({name, description, charity}, callback) {

		// Save reference to model
		var Update = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Update.GUID(function (err, GUID) {
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
				var set = {
					'guid': GUID,
					'name': name,
					'charity': charity.guid,
					'dateCreated': Dates.now(),
				};
				if (description) set.description = description;
				var update = {
					'$set': set
				};

				// Make database update
				Database.update({
					'model': Update,
					'query': query,
					'update': update,
				}, function (err, update) {
					callback(err, update);
				});
			},

		], function (err, update) {
			callback(err, update);
		});
	};
};

// Update Instance Methods: attaches functionality related to existing instances of the object
function UpdateInstanceMethods (schema) {

	/**
	 * Edits an exiting update
	 * @memberof model/Update#
	 * @param {Object} params
	 * @param {String} [params.name] Name of update
	 * @param {String} [params.description] Update description
	 * @param {Object} params.token Decoded authentication token object
	 * @param {function(err, update)} callback Callback function
	 */
	schema.methods.edit = function ({name, description, token}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Update = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var set = {
			'lastModified': Dates.now(),
		};
		if (name) set.name = name;
		if (description) set.description = description;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': Update.constructor,
			'query': query,
			'update': update,
		}, function (err, update) {
			callback(err, update);
		});
	};

};

// Export update model object
module.exports = function () {

	// Make schema for new update object...
	var updateSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(updateSchema);

	// Add update properties and methods to schema
	UpdateProperties(updateSchema);
	UpdateStaticMethods(updateSchema);
	UpdateInstanceMethods(updateSchema);

	// Create new model object with schema
	var update = Mongoose.model('Update', updateSchema);

	// Return new model object
	return update;
}();