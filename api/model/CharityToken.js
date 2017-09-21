
// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

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
		}

    });
};

// Charity Token Static Methods: attaches functionality used by the schema in general
function CharityTokenStaticMethods (schema) {

	// Create: creates a new user in the database
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
					'email': user.email
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
					console.log(charityToken);
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

	schema.methods.markUsed = function (callback) {

		// Save reference to model
		var CharityToken = this;

		// Setup query with GUID
		var query = {
			'guid': GUID
		};

		// Setup database update
		var update = {
			'$set': {
				'used': Dates.now(),
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
}