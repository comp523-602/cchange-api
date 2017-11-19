/** @namespace tools/Secretary */
// Secretary.js: used for communication with client (handles responses and errors)

// Initialize libraries
const Async = require('async');

// Initialize dependencies
const Messages = require('./Messages');

// Initialize constants
const privateKeys = [
	"_id",
	"__v",
	"password",
	"charityToken"
];

// Helper functions ============================================================
function createError(code, message) {
	return {
		'code': code,
		'message': message,
		'handledError': true
	};
};

function removePrivateKeys(object) {
	for (var i in privateKeys) delete object[privateKeys[i]];
	return object;
}

function formatAndAttachObjects(request, response, callback) {

	// Return if no objectsToFormat
	if (!response.objectsToFormat) {
		callback();
		return;
	}

	// Initialize response body
	if (!response.body) response.body = {};

	// Format all objects in objectsToFormat
	Async.eachOf(response.objectsToFormat, function (object, key, callback) {

		// Format array
		if (object instanceof Array) {
			var formattedObjects = [];
			Async.each(object, function (arrayObject, callback) {
				arrayObject.format({
					'req': request,
					'res': response,
				}, function (err, formattedObject) {
					if (formattedObject) formattedObjects.push(removePrivateKeys(formattedObject));
					callback(err);
				});
			}, function (err) {
				response.body[key] = formattedObjects;
				callback(err);
			})
		}

		// Format single object
		else {
			object.format({
				'req': request,
				'res': response,
			}, function (err, formattedObject) {
				if (formattedObject) response.body[key] = removePrivateKeys(formattedObject);
				callback(err);
			});
		}

	}, function (err) {
		callback(err);
	});

};

module.exports = {

	/**
	 * Attaches JSON to a provided response body
	 * @memberof tools/Secretary
	 * @param {Object} params
	 * @param {Object} params.response Express.js response object
	 * @param {String} param.key Key to attach value with
	 * @param {Object} params.value Object, string, array, etc. to attach
	 */
	addToResponse: function ({response, key, value, noFormat}) {
		if (noFormat) {
			if (!response.body) response.body = {};
			response.body[key] = value;
		} else {
			if (!response.objectsToFormat) response.objectsToFormat = {};
			response.objectsToFormat[key] = value;
		}
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
		if (message) return createError(Messages.codes.serverError, message);
		return createError(Messages.codes.serverError, Messages.serverError);
	},

	/**
	 * Attaches objects, status and message to response, sends response
	 * @memberof tools/Secretary
	 * @param {Object} request Express.js request object
	 * @param {Object} response Express.js response object
	 */
	respond: function (request, response) {

		// Format and attach objects
		formatAndAttachObjects(request, response, function (err) {
			if (err) {

				// Send attachment error
				response.status(Messages.codes.serverError);
				response.body.message = "Error formatting objects";
				response.json(response.body);

			} else {

				// Send successful response
				response.status(Messages.codes.success);
				response.body.message = Messages.success;
				response.json(response.body);
			}
		});

		// Send response

	},
};
