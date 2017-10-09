/** @namespace model/CharityToken */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Charity Token Properties: configures properties for database object
function CharityTokenProperties (schema) {
    schema.add({

		// Token: token used for validation
		'token': {
			'type': String,
			'unique': true,
			'index': true,
			'required': true,
		},

		// Email: the invited user's email
		'email': {
			'type': String,
			'required': true,
		},

		// Expiration: date when token expired
		'expiration': {
			'type': Number,
			'required': true,
		},

		// Used: date when token was used
		'used': {
			'type': Number,
			'default': null,
		},

		// User: GUID of user created with token
		'user': {
			'type': String,
		},

    });
};

// Charity Token Static Methods: attaches functionality used by the schema in general
function CharityTokenStaticMethods (schema) {

	/**
	 * Creates a new charity token in the database
	 * @memberof model/CharityToken
	 */
	schema.statics.create = function ({email}, callback) {

		// Save reference to model
		var CharityToken = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				CharityToken.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Generate a token based on email
			function (GUID, callback) {
				Tokens.sign({
					'guid': GUID,
					'email': email,
				}, config.secret, {}, function (err, token) {
					callback(err, GUID, token);
				});
			},

			// Write new charityToken to the database
			function (GUID, token, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
				var update = {
					'$set': {
						'guid': GUID,
						'email': email,
						'token': token,
						'expiration': Dates.fromNow(10, 'days'),
						'dateCreated': Dates.now(),
					}
				};

				// Make database update
				Database.update({
					'model': CharityToken,
					'query': query,
					'update': update,
				}, function (err, charityToken) {
					callback(err, charityToken);
				});
			},

		], function (err, charityToken) {
			callback(err, charityToken);
		});
	};
};

// Charity Token Instance Methods: attaches functionality related to existing instances of the object
function CharityTokenInstanceMethods (schema) {

	/**
	 * Marks an existing CharityToken as used
	 * @memberof model/CharityToken
	 */
	schema.methods.markUsed = function ({user}, callback) {

		// Save reference to model
		var CharityToken = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$set': {
				'used': Dates.now(),
				'user': user.guid,
			}
		};

		// Make database update
		Database.update({
			'model': CharityToken.constructor,
			'query': query,
			'update': update,
		}, function (err, charityToken) {
			callback(err, charityToken);
		});

	};

};

// Export charityToken model object
module.exports = function () {

	// Make schema for new charityToken object...
	var charityTokenSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(charityTokenSchema);

	// Add charityToken properties and methods to schema
	CharityTokenProperties(charityTokenSchema);
	CharityTokenStaticMethods(charityTokenSchema);
	CharityTokenInstanceMethods(charityTokenSchema);

	// Create new model object with schema
	var charityToken = Mongoose.model('CharityToken', charityTokenSchema);

	// Return new model object
	return charityToken;
}();