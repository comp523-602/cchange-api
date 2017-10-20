/** @namespace tools/Secretary */
// Secretary.js: used for communication with client (handles responses and errors)

// Initialize dependencies
const Messages = require('./Messages');

function prepareResponse (response) {
	if (!response.body) response.body = {};
};

function createError(code, message) {
	return {
		'code': code,
		'message': message,
		'handledError': true
	};
};

module.exports = {

	/**
	 * Attaches JSON to a provided response body
	 * @memberof tools/Secretary
	 * @param {Object} params
	 * @param {String} params.key Key (name) of attached JSON
	 * @param {Object} params.value Object, string, array, etc. to attach
	 * @param {Object} params.response Express.js response object
	 * @param {Object} params.response Express.js response object
	 */
	addToResponse: function ({key, value, response}) {
		prepareResponse(response);
		response.body[key] = value;
	},

	/**
	 * Creates an error config object for a request error
	 * @memberof tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	requestError: function (message) {
		return createError(Messages.codes.requestError, message);
	},

	/**
	 * Creates an error config object for a conflict error
	 * @memberof tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	conflictError: function (message) {
		return createError(Messages.codes.conflictError, message);
	},

	/**
	 * Creates an error config object for a authorization error
	 * @memberof tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	authorizationError: function (message) {
		return createError(Messages.codes.unauthorizedError, message);
	},

	/**
	 * Creates an error config object for an internal server error
	 * @memberof tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	serverError: function (message) {
		return createError(Messages.codes.serverError, Messages.serverError);
	},

	/**
	 * Adds status and message to response, sends response
	 * @memberof tools/Secretary
	 * @param {Object} response Express.js response object
	 */
	success: function (response) {

		// Set response code
		response.status(Messages.codes.success);

		// Setup response body
		if (!response.body) response.body = {};
		response.body.message = Messages.success;

		// Send response
		response.json(response.body);
	},
};
