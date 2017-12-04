
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
	 * @api {POST} /update.create Create
	 * @apiName Create
	 * @apiGroup Update
	 * @apiDescription Creates a new update for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} name Name of update
	 * @apiParam {String} [description] Description of update
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
				var fields = [
					Validation.string('Name', req.body.name),
				];
				if (req.body.description) fields.push(Validation.string('Description', req.body.description));
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
						'value': update
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
			else Secretary.respond(req, res);
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
	 * @apiParam {String} [name] Name of update
	 * @apiParam {String} [description] Description of update
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
				var fields = [
					Validation.string('Update ID', req.body.update),
				];
				if (req.body.name) fields.push(Validation.string('Name', req.body.name));
				if (req.body.description) fields.push(Validation.string('Description', req.body.description));
				callback(Validation.catchErrors(fields), token);
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
						'value': update
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