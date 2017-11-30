/** @namespace tools/Messages */
// Messages.js: holds messages

module.exports = {

	/**
	 * HTTP Response Codes
	 * @memberof tools/Messages
	 */
	'codes': {
		'success': 200,
		'serverError': 500,
		'requestError': 400,
		'unauthorizedError': 401,
		'conflictError': 409
	},

	/**
	 * Authentication messages
	 * @memberof tools/Messages
	 */
	'authErrors': {
		'missingToken': "Missing authorization token",
		'unauthorized': "Unauthorized",
		'charityUnauthorized': "Unauthorized for charity access",
		'noAccess': "Unauthorized to access object",
		'adminUnauthorized': "You are not authorized to invite charities",
	},

	/**
	 * Type error messages
	 * @memberof tools/Messages
	 */
	'typeErrors': {
		'string': " is not a string",
		'emptyString': " is an empty string",
		'number': " is not a number",
		'array': " is not an array",
	},

	/**
	 * Field error messages
	 * @memberof tools/Messages
	 */
	'fieldErrors': {
		'missing': " is missing",
		'passwordLetter': " is missing a letter",
		'passwordNumber': " is missing a number",
		'isInvalid': " is invalid",
		'sortKey': " is not a valid sort key",
		'invalidImageURL': " is not a valid image URL",
	},

	/**
	 * Conflict error messages
	 * @memberof tools/Messages
	 */
	'conflictErrors': {
		'objectNotFound': "Object not found in the database",
		'emailAlreadyUsed': "An account with this email already exists",
		'emailNotFound': "Email not recognized",
		'passwordIncorrect': "Incorrect password",
		'charityTokenInvalid': "Your token is invalid",
		'charityTokenUsed': "Your invitiation has already been used",
		'charityTokenExpired': "Your invitation has expired",
		'insufficientFunds': "Your balance is insufficient to make this donation",
	},

	/**
	 * Basic server error message
	 * @memberof tools/Messages
	 */
	'serverError': "A server error occured",

	/**
	 * Success message
	 * @memberof tools/Messages
	 */
	'success': "Success!"
};