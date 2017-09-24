
// Authentication.js: authenticates user

// Initialize dependencies
const Token = require('jsonwebtoken');
const Dates = require('./Dates');
const Secretary = require('./Secretary');
const Messages = require('./Messages');

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
		return callback(Secretary.authorizationError(Messages.responses.missingToken));
	}

	// Verifiy token & determine charity user
	Token.verify(token, config.secret, function (err, decodedToken) {

		// Handle successful token
		if (decodedToken) {

			// Error: Missing charity permissions
			if (requireCharityUser && !decodedToken.charity)
				return callback(Secretary.authorizationError(Messages.responses.charityUnauthorized));

			// Success: Handle proper token
			return callback(null, decodedToken);
		}

		// Error: unsuccessful token
		else callback(Secretary.authorizationError(Messages.responses.unauthorized));
	});
};

module.exports = {
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