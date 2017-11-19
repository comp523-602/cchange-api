/** @namespace model/Donation */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Donation Properties: configures properties for database object
function DonationProperties (schema) {
    schema.add({

		// OBJECT TYPE
		'objectType': {
			'type': String,
			'default': "donation"
		},

		// Charity: GUID of the charity this donation is made to
		'charity': {
			'type': String,
			'required': true,
		},

		// Campaign: GUID of the campaign
		'campaign': {
			'type': String,
			'default': null,
		},

		// Post: GUID of the post this donation is made to
		'post': {
			'type': String,
			'default': null,
		},

		// User: GUID of the user this donation is made by
		'user': {
			'type': String,
			'required': true,
		},

		// Amount: number of cents of donation
		'amount': {
			'type': Number,
			'required': true,
		},

    });
};

// Donation Static Methods: attaches functionality used by the schema in general
function DonationStaticMethods (schema) {

	/**
	 * Creates a new donation in the database
	 * @memberof model/Donation
	 * @param {Object} params
	 * @param {Object} params.charity Charity for donation
	 * @param {Object} [params.campaign] Campaign for donation
	 * @param {Object} [params.post] Post for donation
	 * @param {Object} params.user User creating donation
	 * @param {Number} params.number Number of cents of donation
	 * @param {function(err, donation)} callback Callback function
	 */
	schema.statics.create = function ({charity, campaign, post, user, amount}, callback) {

		// Save reference to model
		var Donation = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Donation.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new donation to the database
			function (GUID, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
				var set = {
					'guid': GUID,
					'charity': charity.guid,
					'user': user.guid,
					'amount': amount,
					'dateCreated': Dates.now(),
				};
				if (campaign) set.campaign = campaign.guid;
				if (post) set.post = post.guid;
				var update = {
					'$set': set
				};

				// Make database update
				Database.update({
					'model': Donation,
					'query': query,
					'update': update,
				}, function (err, donation) {
					callback(err, donation);
				});
			},

		], function (err, donation) {
			callback(err, donation);
		});
	};
};

function DonationInstanceMethods (schema) {

	/**
	 * Formats a campaign object to be returned to the client
	 * @memberof model/Donation#
	 * @param {Object} params
	 * @param {Object} params.req Express.js request object
	 * @param {Object} params.res Express.js response object
	 * @param {function(err, formattedObject)} callback Callback function
	 */
	schema.methods.format = function ({req, res}, callback) {
		var formattedObject = this.toObject();
		callback(null, formattedObject);
	};

};

// Export update model object
module.exports = function () {

	// Make schema for new donation object...
	var donationSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(donationSchema);

	// Add donation properties and methods to schema
	DonationProperties(donationSchema);
	DonationStaticMethods(donationSchema);
	DonationInstanceMethods(donationSchema);

	// Create new model object with schema
	var donation = Mongoose.model('Donation', donationSchema);

	// Return new model object
	return donation;
}();