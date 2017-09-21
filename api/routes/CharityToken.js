
// Initialize dependencies
const Async = require('async');
const Tokens = require('jsonwebtoken');
const HashPassword = require('password-hash');
const Database = require('./../tools/Database');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');
const Email = require('./../tools/Email');

// Initialize config
const config = require('./../../config');

// Initialize models
const CharityToken = require('./../model/CharityToken');

// Attach charityToken endpoints to server
module.exports = function (server) {

	// Charity Token Create: creates a new charity token with an email (requires adminPassword)
	server.post('/charityToken.create', function (req, res, next) {

		// Validate required fields
		var err = Validation.catchErrors([
			Validation.password('Admin password', req.body.adminPassword),
			Validation.email('Email', req.body.email),
		]);
		if (err) return next(err);

		// Check password
		if (req.body.adminPassword !== config.adminPassword) {
			return next(Secretary.conflictError(Messages.conflictErrors.adminUnauthorized));
		}

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Create new charity token
			function (callback) {
				CharityToken.create({
					'email': req.body.email,
				}, function (err, charityToken) {
					Secretary.addToResponse({
						'response': res,
						'key': "charityToken",
						'value': charityToken.format(),
					});
					callback(err, charityToken);
				})
			},

			// Email charity token
			function (charityToken, callback) {
				Email.sendCharityToken({
					'token': charityToken.token,
					'email': req.body.email,
				}, function (err) {
					callback(err);
				});
			},

		], function (err, callback) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})
};