
// Initialize dependencies
const Async = require('async');
const HashPassword = require('password-hash');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Initialize models
const User = require('./../model/User');
const CharityToken = require('./../model/CharityToken');

// Attach user endpoints to server
module.exports = function (server) {

	// User Login: queries for an exisiting user, returns authentication and user
	server.post('/user.login', function (req, res, next) {

		// Validate required fields
		var err = Validation.catchErrors([
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
		]);
		if (err) return next(err);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Query for user
			function (callback) {
				Database.findOne({
					'model': User,
					'query': {
						'email': req.body.email,
					}
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.emailNotFound));
					else callback(err, user);
				})
			},

			// Check password, add to request if correct
			function (user, callback) {
				if (HashPassword.verify(req.body.password, user.password)) {
					callback(null, user);
					Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user.format(),
					});
				} else {
					callback(Secretary.conflictError(Messages.conflictErrors.passwordIncorrect));
				}
			},

			// Authenticate user, add token to request
			function (user, callback) {
				Authentication.makeUserToken(user, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token
					})
					callback(err);
				});
			},

		], function (err, callback) {
			if (err) next(err);
			else Secretary.success(res);
		})
	})

	// User Create: creates a new user, returns authentication and new user
	server.post('/user.create', function (req, res, next) {

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
			Validation.string('Name', req.body.name)
		];
		if (req.body.charityToken) validations.push(Validation.string('Token', req.body.charityToken));
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Hash password
		var password = HashPassword.generate(req.body.password);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Check if email is unique
			function (callback) {
				Database.findOne({
					'model': User,
					'query': {
						'email': req.body.email,
					},
				}, function (err, user) {
					if (user) callback(Secretary.conflictError(Messages.conflictErrors.emailAlreadyUsed));
					else callback(err);
				});
			},

			// Validate user's charityToken if provided
			function (callback) {
				if (req.body.charityToken) {
					Database.findOne({
						'model': CharityToken,
						'query': {
							'token': req.body.charityToken,
						},
					}, function (err, charityToken) {
						if (err) {
							callback(err);
						} else if (!charityToken) {
							callback(Secretary.conflictError(Messages.conflictErrors.charityTokenInvalid));
						} else if (charityToken.used) {
							callback(Secretary.conflictError(Messages.conflictErrors.charityTokenUsed));
						} else if (charityToken.expiration < Dates.now()) {
							callback(Secretary.conflictError(Messages.conflictErrors.charityTokenExpired));
						} else {
							callback(null, charityToken);
						}
					})
				} else {
					callback(null, null);
				}
			},

			// Create a new user, add to reply
			function (charityToken, callback) {

				// Setup user details
				var userDetails = {
					'name': req.body.name,
					'email': req.body.email,
					'password': password,
				};

				// Add charityUser boolean if applicable
				if (charityToken) userDetails.charityUser = true;

				// Create user
				User.create(userDetails, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user.format(),
					});
					callback(err, charityToken, user);
				});
			},

			// Mark charityToken as used if applicable
			function (charityToken, user, callback) {
				if (charityToken) charityToken.markUsed({
					'user': user,
				}, function (err) {
					callback(err, user);
				}); else {
					callback(null, user);
				}
			},

			// Create an authentication token for user, add to reply
			function (user, callback) {
				Authentication.makeUserToken(user, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token
					})
					callback(err);
				});
			},

		], function (err, callback) {
			if (err) next(err);
			else Secretary.success(res);
		});
	})
};