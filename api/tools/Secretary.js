
// Secretary.js: used for communication with client (handles responses and errors)

// Initialize dependencies
const Messages = require('./Messages');

function prepareResponse (response) {
	if (!response.body) response.body = {};
};

function addToResponse({key, value, response, databaseObject}) {
	prepareResponse(response);
	response.body[key] = value;
};

function createError(code, message) {
	return {
		'code': code,
		'message': message,
		'handledError': true
	};
};

function success(response) {

	// Set response code
	response.status(Messages.codes.success);

	// Setup response body
	if (!response.body) response.body = {};
	response.body.message = Messages.success;

	// Send response
	response.json(response.body);
};

module.exports = {
	addToResponse: function ({key, value, response, databaseObject}) {
		addToResponse({key, value, response, databaseObject});
	},
	requestError: function (message) {
		return createError(Messages.codes.requestError, message);
	},
	conflictError: function (message) {
		return createError(Messages.codes.conflictError, message);
	},
	authorizationError: function (message) {
		return createError(Messages.codes.unauthorizedError, message);
	},
	serverError: function (message) {
		return createError(Messages.codes.serverError, Messages.serverError);
	},
	success: function (response) {
		success(response);
	},
};
