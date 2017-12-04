
// Initialize dependencies
const Async = require('async');
const HashPassword = require('password-hash');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');
const Paging = require('./../tools/Paging');

// Initialize config
const config = require('./../../config');

// Initialize models
const User = require('./../model/User');
const CharityToken = require('./../model/CharityToken');
const Charity = require('./../model/Charity');
const Campaign = require('./../model/Campaign');
const Update = require('./../model/Update');
const Donation = require('./../model/Donation');
const Post = require('./../model/Donation');

// Attach user endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /list.causesFeed Causes Feed
	 * @apiName Causes Feed
	 * @apiGroup List
	 * @apiDescription Queries a list of campaigns and updates
	 * @apiUse Paging
	 *
	 * @apiSuccess {Array} causesFeed Array of campaign and update objects
	 *
	 * @apiUse Error
	 */
	server.post('/list.causesFeed', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Soft authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					if (err) callback(null, null);
					else callback(null, token);
				});
			},

			// Find user using token
			function (token, callback) {
				if (token) {
					Database.findOne({
						'model': User,
						'query': {
							'guid': token.user,
						},
					}, function (err, user) {
						if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
						else callback(err, user);
					});
				} else callback(null, null);
			},

			// Find updates using followingCharities and add to request
			function (user, callback) {

				// Initialize query
				var query = {};

				// Setup query for users
				if (user) {
					var usersToQuery = user.followingUsers;
					usersToQuery.push(user.guid);
					query = {
						'charity': {
							$in: user.followingCharities,
						},
					};
				};

				// Page objects
				Paging.pageObjects({
					'models': [Campaign, Update],
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "causesFeed",
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
	 * @api {POST} /list.peopleFeed People Feed
	 * @apiName People Feed
	 * @apiGroup List
	 * @apiDescription Queries a list of donations and posts
	 * @apiUse Paging
	 *
	 * @apiSuccess {Array} peopleFeed Array of donation and user objects
	 *
	 * @apiUse Error
	 */
	server.post('/list.peopleFeed', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Soft authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					if (err) callback(null, null);
					else callback(null, token);
				});
			},

			// Find user using token
			function (token, callback) {
				if (token) {
					Database.findOne({
						'model': User,
						'query': {
							'guid': token.user,
						},
					}, function (err, user) {
						if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
						else callback(err, user);
					});
				} else callback(null, null);
			},

			// Find updates using followingCharities and add to request
			function (user, callback) {

				// Initialize query
				var query = {};

				// Setup query for users
				if (user) {
					var usersToQuery = user.followingUsers;
					usersToQuery.push(user.guid);
					query = {
						'user': {
							$in: usersToQuery,
						},
					};
				}

				// Page objects
				Paging.pageObjects({
					'models': [Donation, Post],
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "peopleFeed",
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

};