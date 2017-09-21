
// Authentication.js: authenticates user

// Initialize dependencies
const Token = require('jsonwebtoken');
const Dates = require('./Dates');

// Initialize config
const config = require('./../../config');

// Functions ===================================================================
function getTokenFromRequest (request) {
	if (!request.headers) return null;
	return request.headers.authorization;
};

function authenticateUser (request, requireCharityUser, callback) {

	// Get token from request
	var token = getTokenFromRequest(request);
	if (!token) return callback(true);

	// Verifiy token & determine charity user
	Token.verify(token, config.secret, function (err, decoded) {
		if (decoded) {
			console.log(decoded);
			if (requireCharityUser && !decoded.charityUser)
				return callback(true);
			else return callback();
		} else callback(true);
	});
}

module.exports = {
	authenticateCharityUser: function (request, callback) {
		authenticateUser(request, true, callback);
	},
	authenticateUser: function (request, callback) {
		authenticateUser(request, false, callback);
	},
	makeUserToken: function (user, callback) {
		Token.sign({
			'user': user.guid,
			'charityUser': user.charityUser,
			'exp': parseInt(Dates.fromNow(3, 'days')),
		}, config.secret, function (err, token) {
			callback(err, token);
		});
	},
}