
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

// Attach charityToken endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /charity Charity
	 * @apiName Charity
	 * @apiGroup Charity
	 * @apiDescription Queries and returns a single charity object
	 *
	 * @apiParam {String} charity GUID of charity to return
	 *
	 * @apiSuccess {Object} charity Charity object
	 *
	 * @apiUse Error
	 */
	server.post('/charity', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Charity', req.body.charity),
				]));
			},

			// Find charity and add to request
			function (callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': req.body.charity,
					}
				}, function (err, charity) {
					if (!charity) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity.format(),
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
	 * @api {POST} /charities Charities
	 * @apiName Charities
	 * @apiGroup Charity
	 * @apiDescription Queries and returns a list of charities
	 * @apiUse Paging
	 *
	 * @apiSuccess {Array} charities Array of Charity objects
	 *
	 * @apiUse Error
	 */
	server.post('/charities', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback();
			},

			// Find charity and add to request
			function (callback) {

				// Setup query
				var query = {};

				// Page objects
				Paging.pageObjects({
					'model': Charity,
					'query': query,
					'params': req.body,
				}, function (err, objects) {
					Secretary.addToResponse({
						'response': res,
						'key': "charities",
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
	 * @api {POST} /charity.edit Edit
	 * @apiName Edit
	 * @apiGroup Charity
	 * @apiDescription Edits a charity for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} name Name of charity
	 * @apiParam {String} description Description of charity
	 *
	 * @apiSuccess {Object} charity Charity object
	 *
	 * @apiUse Error
	 */
	server.post('/charity.edit', function (req, res, next) {

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
				if (req.body.logo) fields.push(Validation.imageUrl('Logo', req.body.logo));
				callback(Validation.catchErrors(), token);
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

			// Update charity, add to response
			function (token, charity, callback) {
				charity.edit({
					'token': token,
					'name': req.body.name,
					'description': req.body.description,
					'logo': req.body.logo,
				}, function (err, charity) {
					if (charity) Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity.format(),
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