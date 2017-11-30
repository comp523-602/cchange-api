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
const Donation = require('./../model/Donation');
const Charity = require('./../model/Charity');
const Campaign = require('./../model/Campaign');
const Post = require('./../model/Post');
const User = require('./../model/User');

// Attach campaign endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /donation Donation
	 * @apiName Donation
	 * @apiGroup Donation
	 * @apiDescription Queries and returns a single donation
	 *
	 * @apiParam {String} donation GUID of Donation object
	 *
	 * @apiSuccess {Object} donation Donation object
	 *
	 * @apiUse Error
	 */
	server.post('/donation', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Donation ID (donation)', req.body.donation),
				]));
			},

			// Find donation and add to request
			function (callback) {
				Database.findOne({
					'model': Donation,
					'query': {
						'guid': req.body.donation,
					}
				}, function (err, campaign) {
					if (!campaign) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					Secretary.addToResponse({
						'response': res,
						'key': "donation",
						'value': donation,
					});
					callback(err);
				})
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		})
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /donations Donations
	 * @apiName Donations
	 * @apiGroup Donation
	 * @apiDescription Queries and returns a list of donations
	 * @apiUse Paging
	 *
	 * @apiParam {String} [charity] Filter donations made to a single charity
	 * @apiParam {String} [campaign] Filter donations made to a single campaign
	 * @apiParam {String} [post] Filter donations made to a single post
	 * @apiParam {String} [user] Filter donations made by a single user
	 *
	 * @apiSuccess {Array} updates Array of donation objects
	 *
	 * @apiUse Error
	 */
	server.post('/donations', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate fields
			function (callback) {
				var fields = [];
				if (req.body.charity) fields.push(Validation.string('Charity ID (charity)', req.body.charity));
				if (req.body.campaign) fields.push(Validation.string('Campaign ID (campaign)', req.body.campaign));
				if (req.body.post) fields.push(Validation.string('Post ID (post)', req.body.post));
				if (req.body.user) fields.push(Validation.string('User ID (user)', req.body.user));
				callback(Validation.catchErrors(fields));
			},

			// Page campaigns and add to request
			function (callback) {

				// Setup query
				var query = {};
				if (req.body.charity) query.charity = req.body.charity;
				if (req.body.campaign) query.campaign = req.body.campaign;
				if (req.body.post) query.post = req.body.post;
				if (req.body.user) query.charity = req.body.user;

				// Page objects
				Paging.pageObjects({
					'model': Donation,
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "donations",
						'value': objects
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		})
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /donation.create Create
	 * @apiName Create
	 * @apiGroup Donation
	 * @apiDescription Creates a new donation for a charity, campaign or post
	 * @apiUse Authorization
	 *
	 * @apiParam {Number} amount Number of cents of donation
	 * @apiParam {String} [post] GUID of post to make donation to (ignores campaign and charity)
	 * @apiParam {String} [campaign] GUID of campaign to make donation to (ignores post and charity)
	 * @apiParam {String} [charity] GUID of charity to make donation to (ignores campaign and post)
	 *
	 * @apiSuccess {Object} donation Donation object
	 * @apiSuccess {Object} charity Charity object
	 * @apiSuccess {Object} user Donating user object
	 * @apiSuccess {Object} [campaign] Campaign object (if campaign or post provided)
	 * @apiSuccess {Object} [post] Post object (if post provided)
	 *
	 * @apiUse Error
	 */
	server.post('/donation.create', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate required fields
			function (token, callback) {
				var fields = [
					Validation.currency('Amount', req.body.amount),
				];
				if (req.body.post) fields.push(Validation.string('Post ID (post)', req.body.post));
				else if (req.body.campaign) fields.push(Validation.string('Campaign ID (campaign)', req.body.campaign));
				else if (req.body.charity) fields.push(Validation.string('Charity ID (charity)', req.body.charity));
				callback(Validation.catchErrors(fields), token);
			},

			// Get user object with token, check if enough funds are available
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					}
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else {
						if (req.body.amount > user.balance) {
							callback(Secretary.conflictError(Messages.conflictErrors.insufficientFunds));
						} else callback(err, user);
					}
				})
			},

			// Find post object if applicable
			function (user, callback) {
				if (req.body.post) {
					Database.findOne({
						'model': Post,
						'query': {
							'guid': req.body.post,
						}
					}, function (err, post) {
						if (!post) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
						else callback(err, user, post);
					})
				} else {
					callback(null, user, null);
				}
			},

			// Find campaign object if applicable
			function (user, post, callback) {
				if (post || req.body.campaign) {
					var campaignToFind = req.body.campaign;
					if (!campaignToFind) campaignToFind = post.campaign;
					Database.findOne({
						'model': Campaign,
						'query': {
							'guid': campaignToFind,
						}
					}, function (err, campaign) {
						if (!campaign) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
						else callback(err, user, post, campaign);
					})
				} else {
					callback(null, user, null, null);
				}
			},

			// Find charity object
			function (user, post, campaign, callback) {
				if (campaign || req.body.charity) {
					var charityToFind = req.body.charity;
					if (!charityToFind) charityToFind = campaign.charity;
					Database.findOne({
						'model': Charity,
						'query': {
							'guid': charityToFind,
						}
					}, function (err, charity) {
						if (!charity) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
						else callback(err, user, post, campaign, charity);
					})
				} else {
					callback(Secretary.requestError("You must provide a post, campaign or charity to make a donation."));
				}
			},

			// Decrement user's funds
			function (user, post, campaign, charity, callback) {
				user.updateBalance({
					'change': 0-req.body.amount,
				}, function (err, user) {
					callback(err, user, post, campaign, charity);
				});
			},

			// Make donation, add to request
			function (user, post, campaign, charity, callback) {
				Donation.create({
					'user': user,
					'post': post,
					'campaign': campaign,
					'charity': charity,
					'amount': req.body.amount,
				}, function (err, donation) {
					if (donation) Secretary.addToResponse({
						'response': res,
						'key': "donation",
						'value': donation
					});
					callback(err, user, post, campaign, charity, donation);
				})
			},

			// Add donation to user, attach to response
			function (user, post, campaign, charity, donation, callback) {
				user.addDonation({
					'donation': donation
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user
					});
					callback(err, post, campaign, charity, donation);
				})
			},

			// Add donation to post, attach to response (if applicable)
			function (post, campaign, charity, donation, callback) {
				if (post) {
					post.addDonation({
						'donation': donation
					}, function (err, post) {
						if (post) Secretary.addToResponse({
							'response': res,
							'key': "post",
							'value': post
						});
						callback(err, campaign, charity, donation);
					});
				} else {
					callback(null, campaign, charity, donation);
				}
			},

			// Add donation to campaign (if applicable)
			function (campaign, charity, donation, callback) {
				if (campaign) {
					campaign.addDonation({
						'donation': donation
					}, function (err, campaign) {
						if (campaign) Secretary.addToResponse({
							'response': res,
							'key': "campaign",
							'value': campaign
						});
						callback(err, charity, donation);
					});
				} else {
					callback (null, charity, donation);
				}
			},

			// Add donation to charity
			function (charity, donation, callback) {
				charity.addDonation({
					'donation': donation
				}, function (err, charity) {
					if (charity) Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		})
	})
};