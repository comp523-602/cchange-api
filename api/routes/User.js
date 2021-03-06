
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
const Post = require('./../model/Donation');

// Attach user endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.login Login
	 * @apiName Login
	 * @apiGroup User
	 * @apiDescription Authenticates a user with an email and password
	 *
	 * @apiParam {String} email User's email address
	 * @apiParam {String} password User's password
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 * @apiSuccess {Object} charity Charity object (if user is a charity administrator)
	 *
	 * @apiUse Error
	 */
	server.post('/user.login', function (req, res, next) {

		// Validate required fields
		var err = Validation.catchErrors([
			Validation.email('Email', req.body.email),
			Validation.string('Password', req.body.password),
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
						'value': user,
					});
				} else {
					callback(Secretary.conflictError(Messages.conflictErrors.passwordIncorrect));
				}
			},

			// Add charity to response if user has a charity
			function (user, callback) {
				if (user.charity) {
					Database.findOne({
						'model': Charity,
						'query': {
							'guid': user.charity,
						}
					}, function (err, charity) {
						if (charity) Secretary.addToResponse({
							'response': res,
							'key': "charity",
							'value': charity
						});
						callback(err, user);
					});
				} else {
					callback(null, user);
				}
			},

			// Authenticate user, add token to request
			function (user, callback) {
				Authentication.makeUserToken(user, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token,
						'noFormat': true,
					})
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
	 * @api {POST} /user.create Create
	 * @apiName Create
	 * @apiGroup User
	 * @apiDescription Creates a new user, returns authentication and new user
	 *
	 * @apiParam {String} name User's name
	 * @apiParam {String} email User's email address
	 * @apiParam {String} password User's password (min. 8 characters, numbers and letter required)
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 *
	 * @apiUse Error
	 */
	server.post('/user.create', function (req, res, next) {

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
			Validation.string('Name', req.body.name)
		];
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
						'value': user,
					});
					callback(err, user);
				});
			},

			// Create an authentication token for user, add to reply
			function (user, callback) {
				Authentication.makeUserToken(user, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token,
						'noFormat': true
					})
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.create.charity Create (Charity)
	 * @apiName Create (Charity)
	 * @apiGroup User
	 * @apiDescription Creates a new user with a charity, returns authentication, user, charity
	 *
	 * @apiParam {String} name User's name
	 * @apiParam {String} email User's email address
	 * @apiParam {String} password User's password
	 * @apiParam {String} charityName Name of charity
	 * @apiParam {String} charityToken Charity token (provided in email to user)
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 * @apiSuccess {Object} charity Charity object
	 *
	 * @apiUse Error
	 */
	server.post('/user.create.charity', function (req, res, next) {

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
			Validation.string('Name', req.body.name),
			Validation.string('Charity token', req.body.charityToken),
			Validation.string('Charity name', req.body.charityName),
		];
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
			},

			// Create a charity
			function (charityToken, callback) {
				Charity.create({
					'name': req.body.charityName,
					'charityToken': charityToken,
				}, function (err, charity) {
					callback(err, charityToken, charity);
				});
			},

			// Create a new user with charityGUID, add to reply
			function (charityToken, charity, callback) {
				User.create({
					'name': req.body.name,
					'email': req.body.email,
					'password': password,
					'charityGUID': charity.guid,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					callback(err, charityToken, charity, user);
				});
			},

			// Add user to charity, attach charity to response
			function (charityToken, charity, user, callback) {
				charity.addUser({
					'user': user,
				}, function (err, charity) {
					if (charity) Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity,
					});
					callback(err, charityToken, user);
				});
			},

			// Mark charityToken as used
			function (charityToken, user, callback) {
				charityToken.markUsed({
					'user': user,
				}, function (err) {
					callback(err, user);
				});
			},

			// Create an authentication token for user, add to reply
			function (user, callback) {
				Authentication.makeUserToken(user, function (err, token) {
					Secretary.addToResponse({
						'response': res,
						'key': "token",
						'value': token,
						'noFormat': true
					})
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.edit Edit
	 * @apiName Edit
	 * @apiGroup User
	 * @apiDescription Edits an existing user
	 *
	 * @apiParam {String} [name] User's name
	 * @apiParam {String} [bio] User's bio
	 * @apiParam {String} [picture] URL of User's profile picture
	 *
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	server.post('/user.edit', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				var fields = [];
				if (req.body.name) fields.push(Validation.string('Name', req.body.name));
				if (req.body.bio) fields.push(Validation.string('Bio', req.body.bio));
				if (req.body.picture) fields.push(Validation.imageUrl('Picture', req.body.picture));
				callback(Validation.catchErrors(fields), token);
			},

			// Find user using token
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, user);
				});
			},

			// Update user, add to reply
			function (user, callback) {
				user.edit({
					'name': req.body.name,
					'bio': req.body.bio,
					'picture': req.body.picture,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					callback(err, user);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.addFunds Add Funds
	 * @apiName Add Funds
	 * @apiGroup User
	 * @apiDescription Adds funds to a users balance
	 *
	 * @apiParam {Number} amount Amount of funds to add (in cents)
	 *
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	server.post('/user.addFunds', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.positiveNumber('Amount', req.body.amount)
				]), token);
			},

			// Find user using token
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, user);
				});
			},

			// Update user's balance, add to reply
			function (user, callback) {
				user.updateBalance({
					'change': req.body.amount,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					callback(err, user);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.followUser Follow User
	 * @apiName Follow User
	 * @apiGroup User
	 * @apiDescription Allows an authorized user to follow another user
	 *
	 * @apiParam {String} user User to follow's GUID
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {Object} profileUser Followed user object
	 *
	 * @apiUse Error
	 */
	server.post('/user.followUser', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('User ID (user)', req.body.user)
				]), token);
			},

			// Find user to follow using token
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': req.body.user,
					},
				}, function (err, userToFollow) {
					if (!userToFollow) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, userToFollow);
				});
			},

			// Find user using token
			function (token, userToFollow, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, userToFollow, user);
				});
			},

			// Update user, add to reply
			function (userToFollow, user, callback) {
				user.addFollowingUser({
					'user': userToFollow,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					Secretary.addToResponse({
						'response': res,
						'key': "profileUser",
						'value': userToFollow,
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.unfollowUser Unfollow User
	 * @apiName Unfollow User
	 * @apiGroup User
	 * @apiDescription Allows an authorized user to unfollow a user
	 *
	 * @apiParam {String} user User to unfollow's GUID
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {Object} profileUser Unfollowed user object
	 *
	 * @apiUse Error
	 */
	server.post('/user.unfollowUser', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('User ID (user)', req.body.user)
				]), token);
			},

			// Find user to follow using token
			function (token, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': req.body.user,
					},
				}, function (err, userToUnfollow) {
					if (!userToUnfollow) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, userToUnfollow);
				});
			},

			// Find user using token
			function (token, userToUnfollow, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, userToUnfollow, user);
				});
			},

			// Update user, add to reply
			function (userToUnfollow, user, callback) {
				user.removeFollowingUser({
					'user': userToUnfollow,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					Secretary.addToResponse({
						'response': res,
						'key': "profileUser",
						'value': userToUnfollow,
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.followCharity Follow Charity
	 * @apiName Follow Charity
	 * @apiGroup User
	 * @apiDescription Allows an authorized user to follow a charity
	 *
	 * @apiParam {String} charity Charity to follow's GUID
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {Object} charity Followed charity object
	 *
	 * @apiUse Error
	 */
	server.post('/user.followCharity', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('Charity ID (charity)', req.body.charity)
				]), token);
			},

			// Find charity to follow using token
			function (token, callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': req.body.charity,
					},
				}, function (err, charityToFollow) {
					if (!charityToFollow) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, charityToFollow);
				});
			},

			// Find user using token
			function (token, charityToFollow, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, charityToFollow, user);
				});
			},

			// Update user, add to reply
			function (charityToFollow, user, callback) {
				user.addFollowingCharity({
					'charity': charityToFollow,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charityToFollow,
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

	/**
	 * @memberof apiDocs
	 * @api {POST} /user.unfollowCharity Unfollow Charity
	 * @apiName Unfollow Charity
	 * @apiGroup User
	 * @apiDescription Allows an authorized user to unfollow a charity
	 *
	 * @apiParam {String} charity Charity to unfollow's GUID
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {Object} charity Unfollowed charity object
	 *
	 * @apiUse Error
	 */
	server.post('/user.unfollowCharity', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate fields
			function (token, callback) {
				callback(Validation.catchErrors([
					Validation.string('Charity ID (charity)', req.body.charity)
				]), token);
			},

			// Find user to follow using token
			function (token, callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': req.body.charity,
					},
				}, function (err, charityToUnfollow) {
					if (!charityToUnfollow) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, charityToUnfollow);
				});
			},

			// Find user using token
			function (token, charityToUnfollow, callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, function (err, user) {
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, charityToUnfollow, user);
				});
			},

			// Update user, add to reply
			function (charityToUnfollow, user, callback) {
				user.removeFollowingCharity({
					'charity': charityToUnfollow,
				}, function (err, user) {
					if (user) Secretary.addToResponse({
						'response': res,
						'key': "user",
						'value': user,
					});
					Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charityToUnfollow,
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		});
	})

};