/** @namespace model/Campaign */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize external models
const Charity = require('./Charity.js');

// Initialize config
const config = require('./../../config');

/**
 * Checks if authenticated user can edit campaign
 * @memberof model/Campaign
 * @param {Object} campaign Campaign object
 * @param {Object} token Decoded token object
 * @return {Boolean} True if user can edit campaign
 */
function authenticatedToken (campaign, token) {
	if (token.charity == campaign.charity) return true;
	return false;
};

// Campaign Properties: configures properties for database object
function CampaignProperties (schema) {
    schema.add({

		// OBJECT TYPE
		'objectType': {
			'type': String,
			'default': "campaign"
		},

		// Charity: GUID of the charity this campaign belongs to
		'charity': {
			'type': String,
			'required': true,
		},

		// Name: name of campaign
		'name': {
			'type': String,
			'index': true,
			'required': true,
		},

		// Description: description of campaign
		'description': {
			'type': String,
			'default': "",
		},

		// Pictures: array of campaign image URLs
		'pictures': {
			'type': Array,
			'default': [],
		},

		// Updates: array of update GUIDs
		'updates': {
			'type': Array,
			'default': [],
		},

		// Posts: array of post GUIDs
		'posts': {
			'type': Array,
			'default': [],
		},

		// Donations: array of updates made to campaign
		'donations': {
			'type': Array,
			'default': [],
		},

    });
};

// Campaign Static Methods: attaches functionality used by the schema in general
function CampaignStaticMethods (schema) {

	/**
	 * Creates a new campaign in the database
	 * @memberof model/Campaign
	 * @param {Object} params
	 * @param {String} params.name Name of campaign
	 * @param {String} [params.description] Campaign description
	 * @param {Array} [params.pictures] Array of image URLs
	 * @param {Object} params.charity Charity object
	 * @param {function(err, campaign)} callback Callback function
	 */
	schema.statics.create = function ({name, description, pictures, charity}, callback) {

		// Save reference to model
		var Campaign = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Campaign.GUID(function (err, GUID) {
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
				if (pictures) set.pictures = pictures;
				var update = {
					'$set': set
				};

				// Make database update
				Database.update({
					'model': Campaign,
					'query': query,
					'update': update,
				}, function (err, campaign) {
					callback(err, campaign);
				});
			},

		], function (err, campaign) {
			callback(err, campaign);
		});
	};
};

// Campaign Instance Methods: attaches functionality related to existing instances of the object
function CampaignInstanceMethods (schema) {

	/**
	 * Formats a campaign object to be returned to the client
	 * @memberof model/Campaign#
	 * @param {Object} params
	 * @param {Object} params.req Express.js request object
	 * @param {Object} params.res Express.js response object
	 * @param {function(err, formattedObject)} callback Callback function
	 */
	schema.methods.format = function ({req, res}, callback) {

		// Initialize formatted object
		var thisObject = this.toObject();

		Async.waterfall([

			// Attach charity metadata
			function (callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': thisObject.charity,
					}
				}, function (err, charity) {
					if (charity) {
						thisObject.charityName = charity.name;
						thisObject.charityLogo = charity.logo;
						thisObject.charityDescription = charity.description;
					}
					callback();
				});
			},

		], function (err) {
			callback(err, thisObject);
		})
	};

	/**
	 * Adds a post to the posts array
	 * @memberof model/Campaign#
	 * @param {Object} params
	 * @param {Object} params.post Post object to be added
	 * @param {function(err, campaign)} callback Callback function
	 */
	schema.methods.addPost = function ({post}, callback) {

		// Save reference to model
		var Campaign = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'posts': post.guid,
			}
		};

		// Make database update
		Database.update({
			'model': Campaign.constructor,
			'query': query,
			'update': update,
		}, function (err, campaign) {
			callback(err, campaign);
		});
	};

	/**
	 * Adds a donation to the donation array
	 * @memberof model/Campaign#
	 * @param {Object} params
	 * @param {Object} params.donation Donation object to be added
	 * @param {function(err, campaign)} callback Callback function
	 */
	schema.methods.addDonation = function ({donation}, callback) {

		// Save reference to model
		var Campaign = this;

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
			'model': Campaign.constructor,
			'query': query,
			'update': update,
		}, function (err, campaign) {
			callback(err, campaign);
		});
	};

	/**
	 * Edits a campaign
	 * @memberof model/Campaign#
	 * @param {Object} params
	 * @param {String} [params.name] Name of campaign
	 * @param {String} [params.description] Campaign description
	 * @param {Array} [params.pictures] Array of image URLs
	 * @param {Object} params.token Decoded authentication token object
	 * @param {function(err, campaign)} callback Callback function
	 */
	schema.methods.edit = function ({name, description, pictures, token}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Campaign = this;

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
		if (pictures) set.pictures = pictures;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': Campaign.constructor,
			'query': query,
			'update': update,
		}, function (err, campaign) {
			callback(err, campaign);
		});
	};

};

// Export update model object
module.exports = function () {

	// Make schema for new campaign object...
	var campaignSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(campaignSchema);

	// Add campaign properties and methods to schema
	CampaignProperties(campaignSchema);
	CampaignStaticMethods(campaignSchema);
	CampaignInstanceMethods(campaignSchema);

	// Create new model object with schema
	var campaign = Mongoose.model('Campaign', campaignSchema);

	// Return new model object
	return campaign;
}();