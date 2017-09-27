
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

	// Charity: queries and returns a single charity
	server.post('/charity', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Charity ID (charity)', req.body.charity),
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

	// Charities: queries and returns a list of charities
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

	// Charity Edit: updates a charity
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

			// Update charity, add to response
			function (token, charity, callback) {
				charity.edit({
					'token': token,
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, charity) {
					Secretary.addToResponse({
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