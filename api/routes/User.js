
// Initialize dependencies
const Async = require('async');
const Tokens = require('jsonwebtoken');
const HashPassword = require('password-hash');
const Database = require('./../tools/Database');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');

// Initialize config
const config = require('./../../config');

// Initialize models
const User = require('./../model/User')();

// Attach user endpoints to server
module.exports = function (server) {

	// User Login: queries for an exisiting user, returns authentication and user
	server.post('/user.login', function (req, res, next) {

		// Validate all fields
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
				Tokens.sign({
					'guid': user.guid
				}, config.secret, {
					'expiresIn': '3 days',
				}, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token
					})
					callback(err);
				});
			},

		], function (err, callback) {
			next(err);
		})
	})

	// User Create: creates a new user, returns authentication and new user
	server.post('/user.create', function (req, res, next) {

		// Validate all fields
		var err = Validation.catchErrors([
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
			Validation.string('Name', req.body.name)
		]);
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

			// Create a new user, add to reply
			function (callback) {
				User.create({
					'name': req.body.name,
					'email': req.body.email,
					'password': password,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user.format(),
					});
					callback(err, user);
				});
			},

			// Create an authentication token for user, add to reply
			function (user, callback) {
				Tokens.sign({
					'guid': user.guid
				}, config.secret, {
					'expiresIn': '3 days',
				}, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token
					})
					callback(err);
				});
			},

		], function (err, callback) {
			next(err);
		});
	})
};