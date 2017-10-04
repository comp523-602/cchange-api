
// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Authenticated Token: authenicates user to edit campaign
function authenticatedToken (campaign, token) {
	if (token.charity == campaign.charity) return true;
	return false;
};

// Campaign Properties: configures properties for database object
function CampaignProperties (schema) {
    schema.add({

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

    });
};

// Campaign Static Methods: attaches functionality used by the schema in general
function CampaignStaticMethods (schema) {

	// Create: creates a new campaign in the database
	schema.statics.create = function ({name, description, charity}, callback) {

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
				var update = {
					'$set': {
						'guid': GUID,
						'name': name,
						'description': description,
						'charity': charity.guid
					}
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

	// Edit: updates campaign object
	schema.methods.edit = function ({name, description, token}, callback) {

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
		var update = {
			'$set': {
				'name': name,
				'description': description,
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