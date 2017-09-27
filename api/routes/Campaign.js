
// Initialize dependencies
const Async = require('async');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Paging = require('./../tools/Paging');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Initialize models
const Charity = require('./../model/Charity');
const Campaign = require('./../model/Campaign');

// Attach campaign endpoints to server
module.exports = function (server) {

	// Campaign: queries and returns a single campaign
	server.post('/campaign', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Campaign ID (campaign)', req.body.campaign),
				]));
			},

			// Find campaign and add to request
			function (callback) {
				Database.findOne({
					'model': Campaign,
					'query': {
						'guid': req.body.campaign,
					}
				}, function (err, campaign) {
					if (!campaign) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					Secretary.addToResponse({
						'response': res,
						'key': "campaign",
						'value': campaign.format(),
					});
					callback(err);
				})
			},

		], function (err) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})

	// Campaigns: queries and returns a list of campaigns
	server.post('/campaigns', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate fields
			function (callback) {
				callback();
			},

			// Page campaigns and add to request
			function (callback) {

				// Setup query
				var query = {};

				// Page objects
				Paging.pageObjects({
					'model': Campaign,
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "campaigns",
						'value': objects
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})

	// Campaign Create: creates a campaign
	server.post('/campaign.create', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate charity user
			function (callback) {
				Authentication.authenticateCharityUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate required fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('Name', req.body.name),
					Validation.string('Description', req.body.description),
				]), token);
			},

			// Find charity
			function (token, callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': token.charity,
					}
				}, function (err, charity) {
					if (!charity) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, charity);
				})
			},

			// Create campaign
			function (token, charity, callback) {
				Campaign.create({
					'charity': charity,
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, campaign) {
					if (campaign) Secretary.addToResponse({
						'response': res,
						'key': "campaign",
						'value': campaign.format()
					});
					callback(err, token, charity, campaign);
				});
			},

			// Add campaign to charity
			function (token, charity, campaign, callback) {
				charity.addCampaign({
					'token': token,
					'campaign': campaign
				}, function (err, charity) {
					callback(err)
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})

	// Campaign Edit: edits a campaign
	server.post('/campaign.edit', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate charity user
			function (callback) {
				Authentication.authenticateCharityUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate required fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('Campaign ID', req.body.campaign),
					Validation.string('Name', req.body.name),
					Validation.string('Description', req.body.description),
				]), token);
			},

			// Find campaign
			function (token, callback) {
				Database.findOne({
					'model': Campaign,
					'query': {
						'guid': req.body.campaign,
					}
				}, function (err, campaign) {
					if (!campaign) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, campaign);
				})
			},

			// Create campaign
			function (token, campaign, callback) {
				campaign.edit({
					'token': token,
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, campaign) {
					if (campaign) Secretary.addToResponse({
						'response': res,
						'key': "campaign",
						'value': campaign.format()
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})
};