
// Authentication.js: authenticates user

// Initialize dependencies
const Token = require('jsonwebtoken');
const Dates = require('./Dates');
const Secretary = require('./Secretary');
const Messages = require('./Messages');
const Types = require('./Types');

// Initialize config
const config = require('./../../config');

// Functions ===================================================================

function getTokenFromRequest (request) {
	if (!request.headers) return null;
	return request.headers.authorization;
};

function makeUserToken (user, callback) {

	// Setup base object
	var signedObject = {
		'user': user.guid,
		'exp': parseInt(Dates.fromNow(3, 'days')),
	};

	// Add charity if applicable
	if (user.charity) signedObject.charity = user.charity;

	// Create token using object and secret
	Token.sign(signedObject, config.secret, function (err, token) {
		callback(err, token);
	});
};

function authenticateUser (request, requireCharityUser, callback) {

	// Get token from request
	var token = getTokenFromRequest(request);

	// Error: Missing token
	if (!token) {
		return callback(Secretary.authorizationError(Messages.authErrors.missingToken));
	}

	// Verifiy token & determine charity user
	Token.verify(token, config.secret, function (err, decodedToken) {

		// Handle successful token
		if (decodedToken) {

			// Error: Missing charity permissions
			if (requireCharityUser && !decodedToken.charity)
				return callback(Secretary.authorizationError(Messages.authErrors.charityUnauthorized));

			// Success: Handle proper token
			return callback(null, decodedToken);
		}

		// Error: unsuccessful token
		else callback(Secretary.authorizationError(Messages.authErrors.unauthorized));
	});
};

function getAuthenticationType (request, callback) {

	// Get token from request
	var token = getTokenFromRequest(request);

	// Handle missing token (public authorization)
	if (!token) return callback(null, Types.auth.public);

	// Handle provided token
	Token.verify(token, config.secret, function (err, decodedToken) {

		// Handle error
		if (err) callback(err);

		// Handle successful token
		if (decodedToken) {

			// Handle charity token (charity authorization)
			if (decodedToken.charity) return callback(null, Types.auth.charity);

			// Handle user token (user authorization)
			return callback(null, Types.auth.user);
		}

		// Handle unsuccessful token (public authorization)
		else return callback(null, Types.auth.public);
	});

};

module.exports = {
	getAuthenticationType: function (request, callback) {
		getAuthenticationType(request, callback);
	},
	authenticateCharityUser: function (request, callback) {
		authenticateUser(request, true, callback);
	},
	authenticateUser: function (request, callback) {
		authenticateUser(request, false, callback);
	},
	makeUserToken: function (user, callback) {
		makeUserToken(user, callback);
	},
}