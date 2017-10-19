
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
const Update = require('./../model/Update');

// Attach campaign endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /update Update
	 * @apiName Update
	 * @apiGroup Update
	 * @apiDescription Queries and returns a single update
	 *
	 * @apiParam {String} update GUID of Update object
	 *
	 * @apiSuccess {Object} update Update object
	 *
	 * @apiUse Error
	 */
	server.post('/update', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Update ID (update)', req.body.update),
				]));
			},

			// Find update and add to request
			function (callback) {
				Database.findOne({
					'model': Update,
					'query': {
						'guid': req.body.update,
					}
				}, function (err, update) {
					if (!update)
						return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					Secretary.addToResponse({
						'response': res,
						'key': "update",
						'value': update.format(),
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
	 * @api {POST} /updates Updates
	 * @apiName Updates
	 * @apiGroup Update
	 * @apiDescription Queries and returns a list of updates
	 * @apiUse Paging
	 *
	 * @apiSuccess {Array} updates Array of Update objects
	 *
	 * @apiUse Error
	 */
	server.post('/updates', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate fields
			function (callback) {
				callback();
			},

			// Find updates and add to request
			function (callback) {

				// Setup query
				var query = {};

				// Page objects
				Paging.pageObjects({
					'model': Update,
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "updates",
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
	 * @api {POST} /update.create Create
	 * @apiName Create
	 * @apiGroup Update
	 * @apiDescription Creates a new update for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} name Name of update
	 * @apiParam {String} description Description of update
	 *
	 * @apiSuccess {Object} update Update object
	 *
	 * @apiUse Error
	 */
	server.post('/update.create', function (req, res, next) {

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

			// Create update
			function (token, charity, callback) {
				Update.create({
					'charity': charity,
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, update) {
					if (update) Secretary.addToResponse({
						'response': res,
						'key': "update",
						'value': update.format()
					});
					callback(err, token, charity, update);
				});
			},

			// Add update to charity
			function (token, charity, update, callback) {
				charity.addUpdate({
					'token': token,
					'update': update
				}, function (err, update) {
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
	 * @api {POST} /update.edit Edit
	 * @apiName Edit
	 * @apiGroup Update
	 * @apiDescription Edits an update for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} update GUID of update to edit
	 * @apiParam {String} name Name of update
	 * @apiParam {String} description Description of update
	 *
	 * @apiSuccess {Object} update Update object
	 *
	 * @apiUse Error
	 */
	server.post('/update.edit', function (req, res, next) {

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
					Validation.string('Update ID', req.body.update),
					Validation.string('Name', req.body.name),
					Validation.string('Description', req.body.description),
				]), token);
			},

			// Find update
			function (token, callback) {
				Database.findOne({
					'model': Update,
					'query': {
						'guid': req.body.update,
					}
				}, function (err, update) {
					if (!update) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, update);
				})
			},

			// Edit update
			function (token, update, callback) {
				update.edit({
					'token': token,
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, update) {
					if (update) Secretary.addToResponse({
						'response': res,
						'key': "update",
						'value': update.format()
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