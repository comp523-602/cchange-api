/**
 * @namespace apiDocs
 * @private
 */

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

	/**
	 * @memberof apiDocs
	 * @api {POST} /campaign Campaign
	 * @apiName Campaign
	 * @apiGroup Campaign
	 * @apiDescription Queries and returns a single campaign!
	 *
	 * @apiParam {String} campaign GUID of Campaign object
	 *
	 * @apiSuccess {Object} campaign Campaign object
	 *
	 * @apiUse Error
	 */
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

	/**
	 * @memberof apiDocs
	 * @api {POST} /campaigns Campaigns
	 * @apiName Campaigns
	 * @apiGroup Campaign
	 * @apiDescription Queries and returns a list of campaigns
	 * @apiUse Paging
	 *
	 * @apiParam {String} [charity] Filter campaigns by a single charity
	 *
	 * @apiSuccess {Array} updates Array of Campaign objects
	 *
	 * @apiUse Error
	 */
	server.post('/campaigns', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate fields
			function (callback) {
				var fields = [];
				if (req.body.charity)
					fields.push(Validation.string('Charity ID (charity)', req.body.charity));
				callback(Validation.catchErrors(fields));
			},

			// Page campaigns and add to request
			function (callback) {

				// Setup query
				var query = {};
				if (req.body.charity) query.charity = req.body.charity;

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

	/**
	 * @memberof apiDocs
	 * @api {POST} /campaign.create Create
	 * @apiName Create
	 * @apiGroup Campaign
	 * @apiDescription Creates a new campaign for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} name Name of campaign
	 * @apiParam {String} [description] Description of campaign
	 * @apiParam {Array} [pictures] Array of image URLs for campaign pictures
	 *
	 * @apiSuccess {Object} campaign Campaign object
	 *
	 * @apiUse Error
	 */
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
				var fields = [
					Validation.string('Name', req.body.name),

				];
				if (req.body.description) fields.push(Validation.string('Description', req.body.description));
				if (req.body.pictures) fields.push(Validation.imageUrlArray('Pictures', req.body.pictures));
				callback(Validation.catchErrors(fields), token);
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
					'pictures': req.body.pictures,
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

	/**
	 * @memberof apiDocs
	 * @api {POST} /campaign.edit Edit
	 * @apiName Edit
	 * @apiGroup Campaign
	 * @apiDescription Edits a campaign for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} campaign GUID of campaign to edit
	 * @apiParam {String} [name] Name of campaign
	 * @apiParam {String} [description] Description of campaign
	 * @apiParam {Array} [pictures] Array of image URLs for campaign pictures
	 *
	 * @apiSuccess {Object} campaign Campaign object
	 *
	 * @apiUse Error
	 */
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
				var fields = [
					Validation.string('Campaign ID', req.body.campaign),
				];
				if (req.body.name) fields.push(Validation.string('Name', req.body.name));
				if (req.body.description) fields.push(Validation.string('Description', req.body.description));
				if (req.body.pictures) fields.push(Validation.imageUrlArray('Pictures', req.body.pictures));
				callback(Validation.catchErrors(fields), token);
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
					'pictures': req.body.pictures,
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