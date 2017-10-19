
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
const Post = require('./../model/Post');
const User = require('./../model/User');
const Campaign = require('./../model/Campaign');

// Attach campaign endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /post Post
	 * @apiName Post
	 * @apiGroup Post
	 * @apiDescription Queries and returns a single post
	 *
	 * @apiParam {String} post GUID of Post object
	 *
	 * @apiSuccess {Object} post Post object
	 *
	 * @apiUse Error
	 */
	server.post('/post', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Post ID (post)', req.body.post),
				]));
			},

			// Find post and add to request
			function (callback) {
				Database.findOne({
					'model': Post,
					'query': {
						'guid': req.body.post,
					}
				}, function (err, post) {
					if (!post)
						return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					Secretary.addToResponse({
						'response': res,
						'key': "post",
						'value': post.format(),
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
	 * @api {POST} /posts Posts
	 * @apiName Posts
	 * @apiGroup Post
	 * @apiDescription Queries and returns a list of posts
	 * @apiUse Paging
	 *
	 * @apiParam {String} [campaign] Campaign GUID to filter posts by campaign
	 * @apiParam {String} [charity] Charity GUID to filter posts by charity
	 * @apiParam {String} [user] User GUID to filter posts by user
	 *
	 * @apiSuccess {Array} posts Array of Post objects
	 *
	 * @apiUse Error
	 */
	server.post('/posts', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate fields
			function (callback) {
				var fields = [];
				if (req.body.campaign) fields.push(Validation.string('Campaign ID (campaign)', req.body.campaign));
				if (req.body.charity) fields.push(Validation.string('Charity ID (charity)', req.body.charity));
				if (req.body.user) fields.push(Validation.string('User ID (user)', req.body.user));
				callback(Validation.catchErrors(fields));
			},

			// Find posts and add to request
			function (callback) {

				// Setup query
				var query = {};
				if (req.body.campaign) query.campaign = req.body.campaign;
				if (req.body.charity) query.charity = req.body.charity;
				if (req.body.user) query.user = req.body.user;

				// Page objects
				Paging.pageObjects({
					'model': Post,
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "posts",
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
	 * @api {POST} /post.create Create
	 * @apiName Create
	 * @apiGroup Post
	 * @apiDescription Creates a new post for a user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} campaign GUID of campaign to support
	 * @apiParam {String} image URL of post image
	 * @apiParam {String} [caption] Caption for post
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
				if (req.body.caption) Validation.string('Caption', req.body.caption);
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

			// Create post, add to response
			function (user, campaign, callback) {
				Post.create({
					'user': user,
					'campaign': campaign,
					'image': req.body.image,
					'caption': req.body.caption,
				}, function (err, post) {
					if (post) Secretary.addToResponse({
						'response': res,
						'key': "post",
						'value': post.format()
					});
					callback(err, user, post);
				});
			},

			// Add post to user
			function (user, post, callback) {
				user.addPost({
					'post': post
				}, function (err) {
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
	 * @api {POST} /post.edit Edit
	 * @apiName Edit
	 * @apiGroup Post
	 * @apiDescription Edits a post for a user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} post GUID of post to edit
	 * @apiParam {String} [image] URL of post image
	 * @apiParam {String} [caption] Post caption
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
				];
				if (req.body.image) fields.push(Validation.imageUrl('Image', req.body.image));
				if (req.body.caption) fields.push(Validation.string('Caption', req.body.caption));
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
					if (!update) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, post);
				})
			},

			// Edit post
			function (token, post, callback) {
				post.edit({
					'token': token,
					'image': req.body.image,
					'caption': req.body.caption,
				}, function (err, post) {
					if (update) Secretary.addToResponse({
						'response': res,
						'key': "post",
						'value': post.format()
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