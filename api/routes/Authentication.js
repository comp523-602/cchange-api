
// Initialize dependencies
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');

// Initialize config
const config = require('./../../config');

// Initialize models
const User = require('./../model/User')();

// Attach authentication endpoints to server
module.exports = function (server) {

	// Auth Create: creates a new user and returns authentication
	server.post('/auth.create', function (request, response, next) {

		// Setup reply
		var reply = {};

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Check if email is unique
			function (callback) {
				Database.findOne({
					'model': User,
					'query': {
						'email': request.body.email,
					},
				}, function (err, user) {
					if (user) return response.status(409).json({
						'message': 'Email address already used'
					});
					callback(err);
				});
			},

			// Create a new user, add to reply
			function (callback) {
				User.create({
					'name': request.body.name,
					'email': request.body.email,
					'password': request.body.password,
				}, function (err, user) {
					reply.user = user;
					callback(err, user);
				});
			},

			// Create an authentication token for user, add to reply
			function (user, callback) {
				Tokens.sign({'user': user.guid}, config.secret, {
					'expiresIn': '3 days',
				}, function (err, token) {
					reply.token = token;
					callback(err);
				});
			},

		], function (err, callback) {
			if (!err) {
				reply.message = 'Success!';
				response.json(reply);
				console.log('auth.create success!');
			} else {
				response.status(500).json({
					'message': err
				});
			}
		});
	})
};