
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
};
