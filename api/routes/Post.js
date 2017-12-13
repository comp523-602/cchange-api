
// Initialize dependencies
const Async = require('async');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Paging = require('./../tools/Paging');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');
const Imaging = require('./../tools/Imaging');

// Initialize config
const config = require('./../../config');

// Initialize models
const Post = require('./../model/Post');
const User = require('./../model/User');
const Campaign = require('./../model/Campaign');
const Charity = require('./../model/Charity');
const Donation = require('./../model/Donation');

// Attach campaign endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /post.create Create
	 * @apiName Create
	 * @apiGroup Post
	 * @apiDescription Creates a new post for a user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} campaign GUID of campaign to support
	 * @apiParam {String} image URL of post image
	 * @apiParam {String} [caption] Caption for post
	 * @apiParams {Number} [amount] Amount to donate to campaign upon post creation
	 *
	 * @apiSuccess {Object} post Post object
	 *
	 * @apiUse Error
	 */
	server.post('/post.create', function (req, res, next) {

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
					Validation.string('Campaign ID (campaign)', req.body.campaign),
					Validation.imageUrl('Image', req.body.image),
				];
				if (req.body.caption) fields.push(Validation.string('Caption', req.body.caption));
				if (req.body.amount) fields.push(Validation.currency('Amount', req.body.amount));
				callback(Validation.catchErrors(fields), token);
			},

			// Find user with token
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					}
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, user);
				})
			},

			// Ensure user has enough funds to make donation if applicable
			function (user, callback) {
				if (req.body.amount) {
					if (req.body.amount > user.balance) {
						callback(Secretary.conflictError(Messages.conflictErrors.insufficientFunds));
					} else callback(null, user);
				} else callback(null, user);
			},

			// Find campaign with parameters
			function (user, callback) {
				Database.findOne({
					'model': Campaign,
					'query': {
						'guid': req.body.campaign,
					}
				}, function (err, campaign) {
					if (!campaign) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, user, campaign);
				})
			},

			// Find charity with campaign
			function (user, campaign, callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': campaign.charity,
					}
				}, function (err, charity) {
					if (!charity) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, user, campaign, charity);
				})
			},

			// Get shareable image url
			function (user, campaign, charity, callback) {
				Imaging.createShareableImage({
					'imageURL': req.body.image,
					'logoURL': charity.logo,
					'shareableText': campaign.name,
				}, function (err, shareableImageURL) {
					if (err) callback(Secretary.serverError(err));
					else callback(null, user, campaign, charity, shareableImageURL);
				})
			},

			// Create post, add to response
			function (user, campaign, charity, shareableImageURL, callback) {
				Post.create({
					'user': user,
					'campaign': campaign,
					'charity': charity,
					'image': req.body.image,
					'caption': req.body.caption,
					'shareableImage': shareableImageURL,
				}, function (err, post) {
					if (post) Secretary.addToResponse({
						'response': res,
						'key': "post",
						'value': post
					});
					callback(err, user, post, campaign, charity);
				});
			},

			// Decrement user's funds
			function (user, post, campaign, charity, callback) {
				if (req.body.amount) {
					user.updateBalance({
						'change': 0-req.body.amount,
					}, function (err, user) {
						callback(err, user, post, campaign, charity);
					});
				} else callback(null, user, post, campaign, charity);
			},

			// Make donation, add to request
			function (user, post, campaign, charity, callback) {
				if (req.body.amount) {
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
				} else callback(null, user, post, campaign, charity, null);
			},

			// Add donation to user, attach to response
			function (user, post, campaign, charity, donation, callback) {
				if (donation) {
					user.addDonation({
						'donation': donation
					}, function (err, user) {
						if (user) Secretary.addToResponse({
							'response': res,
							'key': "user",
							'value': user
						});
						callback(err, user, post, campaign, charity, donation);
					})
				} else callback(null, user, post, campaign, charity, null);
			},

			// Add donation to post, attach to response (if applicable)
			function (user, post, campaign, charity, donation, callback) {
				if (post && donation) {
					post.addDonation({
						'donation': donation
					}, function (err, post) {
						if (post) Secretary.addToResponse({
							'response': res,
							'key': "post",
							'value': post
						});
						callback(err, user, post, campaign, charity, donation);
					});
				} else callback(null, user, post, campaign, charity, donation);
			},

			// Add donation to campaign (if applicable)
			function (user, post, campaign, charity, donation, callback) {
				if (campaign && donation) {
					campaign.addDonation({
						'donation': donation
					}, function (err, campaign) {
						if (campaign) Secretary.addToResponse({
							'response': res,
							'key': "campaign",
							'value': campaign
						});
						callback(err, user, post, campaign, charity, donation);
					});
				} else callback (null, user, post, campaign, charity, donation);
			},

			// Add donation to charity
			function (user, post, campaign, charity, donation, callback) {
				if (charity && donation) {
					charity.addDonation({
						'donation': donation
					}, function (err, charity) {
						if (charity) Secretary.addToResponse({
							'response': res,
							'key': "charity",
							'value': charity
						});
						callback(err, user, post, campaign);
					});
				} else callback(null, user, post, campaign);
			},

			// Add post to user
			function (user, post, campaign, callback) {
				user.addPost({
					'post': post
				}, function (err) {
					callback(err, post, campaign)
				});
			},

			// Add post to campaign
			function (post, campaign, callback) {
				campaign.addPost({
					'post': post
				}, function (err) {
					callback(err)
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		})
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /post.edit Edit
	 * @apiName Edit
	 * @apiGroup Post
	 * @apiDescription Edits a post for a user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} post GUID of post to edit
	 * @apiParam {String} caption Post caption
	 *
	 * @apiSuccess {Object} post Post object
	 *
	 * @apiUse Error
	 */
	server.post('/post.edit', function (req, res, next) {

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
					Validation.string('Post ID (post)', req.body.post),
					Validation.string('Caption', req.body.caption),
				];
				callback(Validation.catchErrors(fields), token);
			},

			// Find post
			function (token, callback) {
				Database.findOne({
					'model': Post,
					'query': {
						'guid': req.body.post,
					}
				}, function (err, post) {
					if (!post) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, post);
				})
			},

			// Edit post
			function (token, post, callback) {
				post.edit({
					'token': token,
					'caption': req.body.caption,
				}, function (err, post) {
					if (post) Secretary.addToResponse({
						'response': res,
						'key': "post",
						'value': post
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