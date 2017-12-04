
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
const Post = require('./../model/Post');

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
						'key': "objects",
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
						'key': "objects",
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
	 * @api {POST} /list.type Type
	 * @apiName Type
	 * @apiGroup List
	 * @apiDescription Queries a list of a single type of object
	 *
	 * @apiParam {String} type Type of object to page
	 * @apiParam {String} [charity] Filter objects by charity
	 * @apiParam {String} [campaign] Filter objects by campaign
	 * @apiParam {String} [post] Filter objects by post
	 * @apiParam {String} [user] Filter objects by user
	 * @apiUse Paging
	 *
	 * @apiSuccess {Array} objects Array of objects
	 *
	 * @apiUse Error
	 */
	 server.post('/list.type', function (req, res, next) {

		 // Synchronously perform the following tasks...
		 Async.waterfall([

			 // Validate required fields
			 function (callback) {
				 var fields = [
					 Validation.objectType('Object type', req.body.type),
				 ];
				 if (req.body.charity) fields.push(Validation.string('Charity ID (charity)', req.body.charity));
				 if (req.body.campaign) fields.push(Validation.string('Campaign ID (campaign)', req.body.campaign));
				 if (req.body.post) fields.push(Validation.string('Post ID (post)', req.body.post));
				 if (req.body.user) fields.push(Validation.string('User ID (user)', req.body.user));
				 callback(Validation.catchErrors(fields));
			 },

			 // Find items and add to request
			 function (callback) {

				 // Setup model
				 var model;
				 switch (req.body.type) {
					 case "user": model = User; break;
					 case "post": model = Post; break;
					 case "charity": model = Charity; break;
					 case "campaign": model = Campaign; break;
					 case "update": model = Update; break;
					 case "donation": model = Donation; break;
				 }

				 // Setup query
				 var query = {};
				 if (req.body.charity) query.charity = req.body.charity;
				 if (req.body.campaign) query.campaign = req.body.campaign;
				 if (req.body.post) query.post = req.body.post;
				 if (req.body.user) query.user = req.body.user;

				 // Page objects
				 Paging.pageObjects({
					 'model': model,
					 'query': query,
					 'params': req.body,
				 }, function (err, objects) {
					 if (!objects) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					 Secretary.addToResponse({
						 'response': res,
						 'key': "objects",
						 'value': objects,
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
 	 * @api {POST} /list.single Single
 	 * @apiName Single
 	 * @apiGroup List
 	 * @apiDescription Queries a single object of a given type (by GUID)
 	 *
 	 * @apiParam {String} type Type of object to page
 	 * @apiParam {String} guid GUID of object to page
 	 *
 	 * @apiSuccess {Object} object Single object
 	 *
 	 * @apiUse Error
 	 */
 	 server.post('/list.single', function (req, res, next) {

 		 // Synchronously perform the following tasks...
 		 Async.waterfall([

 			 // Validate required fields
 			 function (callback) {
 				 callback(Validation.catchErrors([
 					 Validation.objectType('Object type', req.body.type),
					 Validation.string('GUID', req.body.guid),
 				 ]));
 			 },

 			 // Find items and add to request
 			 function (callback) {

 				 // Setup model
 				 var model;
 				 switch (req.body.type) {
 					 case "user": model = User; break;
 					 case "post": model = Post; break;
 					 case "charity": model = Charity; break;
 					 case "campaign": model = Campaign; break;
 					 case "update": model = Update; break;
 					 case "donation": model = Donation; break;
 				 }

 				 // Page objects
 				 Database.findOne({
 					 'model': model,
 					 'query': {
						 'guid': req.body.guid,
					 },
 				 }, function (err, object) {
 					 if (!object) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
 					 Secretary.addToResponse({
 						 'response': res,
 						 'key': "object",
 						 'value': object,
 					 });
 					 callback(err);
 				 })
 			 },

 		 ], function (err) {
 			 if (err) next(err);
 			 else Secretary.respond(req, res);
 		 })
 	 })

};