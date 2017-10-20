/** @namespace tools/Authentication */
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
		'exp': parseInt(Dates.fromNow(60, 'days')),
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

	/**
	 * Returns the token from a request object
	 * @memberof tools/Authentication
	 * @param {object} request Express.js request object
	 * @return {string} Encoded token
	 */
	 getTokenFromRequest(request) {
		 return getTokenFromRequest(request);
	 },

	/**
	 * Returns an enumerated authentication type for a given request
	 * @memberof tools/Authentication
	 * @param {object} request Express.js request object
	 * @param {function(err, type)} callback Callback function
	 * @example
	 * getAuthenticationType(request, (err, type) {
	 *	   // handle user authencation
	 * });
	 */
	getAuthenticationType: function (request, callback) {
		getAuthenticationType(request, callback);
	},

	/**
	 * Produces an authentication error or returns a decoded token for a charity user
	 * @memberof tools/Authentication
	 * @param {object} request Express.js request object
	 * @param {function(err, decodedToken)} callback Callback function
	 * @example
	 * authenticateCharityUser(request, (err, decodedToken) {
	 *	   // handle error or decoded token
	 * });
	 */
	authenticateCharityUser: function (request, callback) {
		authenticateUser(request, true, callback);
	},

	/**
	 * Produces an authentication error or returns a decoded token for a user
	 * @memberof tools/Authentication
	 * @param {object} request Express.js request object
	 * @param {function(err, decodedToken)} callback Callback function
	 * @example
	 * authenticateUser(request, (err, decodedToken) {
	 *	   // handle error or decoded token
	 * });
	 */
	authenticateUser: function (request, callback) {
		authenticateUser(request, false, callback);
	},

	/**
	 * Creates a token using a user object
	 * @memberof tools/Authentication
	 * @param {object} user User model object
	 * @param {function(err, encodedToken)} callback Callback function
	 * @example
	 * makeUserToken(user, function (err, token) {
	 *	   // handle error or token
	 * });
	 */
	makeUserToken: function (user, callback) {
		makeUserToken(user, callback);
	},
}