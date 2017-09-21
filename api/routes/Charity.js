
// Initialize dependencies
const Async = require('async');
const HashPassword = require('password-hash');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');
const Email = require('./../tools/Email');

// Initialize config
const config = require('./../../config');

// Initialize models
const Charity = require('./../model/Charity');

// Attach charityToken endpoints to server
module.exports = function (server) {

	// Charity Create: creates a new charity with a name and description
	server.post('/charity.create', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate charity user
			function (callback) {
				Authentication.authenticateCharityUser(req, function (err) {
					if (err) callback(Secretary.authorizationError());
					else callback();
				});
			},

			// Validate required fields
			function (callback) {
				callback(Validation.catchErrors([
					Validation.string('Name', req.body.name),
					Validation.string('Description', req.body.description),
				]));
			},

			// Create new charity
			function (callback) {
				Charity.create({
					'name': req.body.name,
					'description': req.body.description,
				}, function (err, charity) {
					Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity.format(),
					});
					callback(err);
				})
			},

		], function (err, callback) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})
};