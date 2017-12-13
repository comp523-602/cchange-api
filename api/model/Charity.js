/** @namespace model/Charity */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Authentication = require('./../tools/Authentication');
const Dates = require('./../tools/Dates');

const User = require('./User.js');

// Initialize config
const config = require('./../../config');

/**
 * Checks if authenticated user can edit charity
 * @memberof model/Charity
 * @param {Object} charity Charity object
 * @param {Object} token Decoded token object
 * @return {Boolean} True if user can edit charity
 */
function authenticatedToken (charity, token) {
	if (token.charity == charity.guid) return true;
	return false;
};

// Charity Properties: configures properties for database object
function CharityProperties (schema) {
    schema.add({

		// OBJECT TYPE
		'objectType': {
			'type': String,
			'default': "charity"
		},

		// Name: name of charity
		'name': {
			'type': String,
			'index': true,
			'required': true,
		},

		// Description: description of charity
		'description': {
			'type': String,
			'index': true,
			'default': "",
		},

		// Logo: URL of charity logo
		'logo': {
			'type': String,
			'default': "",
		},

		// Charity Token: GUID of the token used to create charity
		'charityToken': {
			'type': String,
			'required': true,
		},

		// Users: GUID of the users that can access this charity
		'users': {
			'type': Array,
			'default': [],
		},

		// Campaigns: GUID of the campaigns that belong to this charity
		'campaigns': {
			'type': Array,
			'default': [],
		},

		// Updates: GUID of the updates that belong to this charity
		'updates': {
			'type': Array,
			'default': [],
		},

		// Donations: GUID of the donations made to this charity
		'donations': {
			'type': Array,
			'default': [],
		},

		// Categories: GUID of the categories this charity belongs to
		'categories': {
			'type': Array,
			'index': true,
			'default': [],
		},

    });

	schema.index({'name': 'text', 'description': 'text'});
};

// Charity Static Methods: attaches functionality used by the schema in general
function CharityStaticMethods (schema) {

	/**
	 * Creates a new charity in the database
	 * @memberof model/Charity
	 * @param {Object} params
	 * @param {String} params.name Name of campaign
	 * @param {Object} params.charityToken Charity Token object
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.statics.create = function ({name, charityToken}, callback) {

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
						'charityToken': charityToken.guid,
						'dateCreated': Dates.now(),
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

	/**
	 * Formats a campaign object to be returned to the client
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.req Express.js request object
	 * @param {Object} params.res Express.js response object
	 * @param {function(err, formattedObject)} callback Callback function
	 */
	schema.methods.format = function ({req, res}, callback) {

		// Initialize formatted object
		var thisObject = this.toObject();

		Async.waterfall([

			// Get request authorization
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(null, token);
				});
			},

			// Attach currentUserFollows boolean
			function (token, callback) {
				if (token) {
					thisObject.currentUserFollows = false;
					Database.findOne({
						'model': User,
						'query': {
							'guid': token.user,
						}
					}, function (err, user) {
						if (user) {
							for (var i in user.followingCharities) {
								if (user.followingCharities[i] == thisObject.guid) {
									thisObject.currentUserFollows = true; break;
								}
							}
						}
						callback();
					});
				} else {
					callback();
				}
			},

			// Attach follower counts
			function (callback) {
				Database.find({
					'model': User,
					'query': {
						'followingCharities': thisObject.guid,
					},
				}, function (err, objects) {
					if (objects) thisObject.followers = objects.length;
					callback();
				})
			},

		], function (err) {
			callback(err, thisObject);
		})
	};

	/**
	 * Adds a user to the users array
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.user User object to be added
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.addUser = function ({user}, callback) {

		// Note: doesn't require authorization (addUser called after create)

		// Save reference to model
		var Charity = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'users': user.guid,
			}
		};

		// Make database update
		Database.update({
			'model': Charity.constructor,
			'query': query,
			'update': update,
		}, function (err, charity) {
			callback(err, charity);
		});
	};

	/**
	 * Adds a campaign and a category to the appropriate arrays
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.campaign Campaign object to be added
	 * @param {String} params.category Category string to be added
	 * @param {Object} params.token Decoded authentication token object
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.addCampaignAndCategory = function ({campaign, category, token}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Charity = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'campaigns': campaign.guid,
			},
			'$addToSet': {
				'categories': category,
			},
		};

		// Make database update
		Database.update({
			'model': Charity.constructor,
			'query': query,
			'update': update,
		}, function (err, charity) {
			callback(err, charity);
		});
	};

	/**
	 * Swaps one category for another
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {String} params.categoryToAdd Category string to be added
	 * @param {String} params.categoryToRemove Category string to be removed
	 * @param {Object} params.token Decoded authentication token object
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.swapCategories = function ({categoryToAdd, categoryToRemove, token}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Charity = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Remove categoryToRemove, add categoryToAdd
		Async.waterfall([

			function (callback) {
				Database.update({
					'model': Charity.constructor,
					'query': query,
					'update': {
						'$pull': {
							'categories': categoryToRemove,
						},
					},
				}, function (err, charity) {
					callback(err);
				});
			},

			function (callback) {
				Database.update({
					'model': Charity.constructor,
					'query': query,
					'update': {
						'$addToSet': {
							'categories': categoryToAdd,
						},
					},
				}, function (err, charity) {
					callback(err, charity);
				});
			},

		], function (err, charity) {
			callback(err, charity);
		})

	};

	/**
	 * Adds an update to the updates array
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.update Update object to be added
	 * @param {Object} params.token Decoded authentication token object
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.addUpdate = function ({update, token}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Charity = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var dbupdate = {
			'$push': {
				'updates': update.guid,
			}
		};

		// Make database update
		Database.update({
			'model': Charity.constructor,
			'query': query,
			'update': dbupdate,
		}, function (err, charity) {
			callback(err, charity);
		});
	};

	/**
	 * Adds a donation to the donation array
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.donation Donation object to be added
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.addDonation = function ({donation}, callback) {

		// Save reference to model
		var Charity = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'donations': donation.guid,
			}
		};

		// Make database update
		Database.update({
			'model': Charity.constructor,
			'query': query,
			'update': update,
		}, function (err, charity) {
			callback(err, charity);
		});
	};

	/**
	 * Edits a charity object
	 * @memberof model/Charity#
	 * @param {Object} params
	 * @param {Object} params.token Decoded authentication token object
	 * @param {String} params.name Name of charity
	 * @param {String} params.description Description of charity
	 * @param {String} params.logo Image URL of charity logo
	 * @param {function(err, charity)} callback Callback function
	 */
	schema.methods.edit = function ({token, name, description, logo}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Charity = this;

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
		if (logo) set.logo = logo;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': Charity.constructor,
			'query': query,
			'update': update,
		}, function (err, charity) {
			callback(err, charity);
		});
	};

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