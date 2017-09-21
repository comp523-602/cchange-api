
// Validation.js: provides tools for validating incoming parameters

// Initialize dependencies
const Messages = require('./Messages');
const Secretary = require('./Secretary');

// Validation helper functions =================================================
function getErrorsFromArray (errors) {
	for (var i in errors) {
		if (errors[i]) {
			return (errors[i]);
		}
	}
	return null;
}

// Type validation functions ===================================================
function isInvalidString (input) {
	if (!(typeof input === 'string' || input instanceof String))
		return Messages.typeErrors.string;
	return null;
};

// String validation functions =================================================
function isProperLength (input, minlength, maxlength) {
	if (minlength && input.length < minlength)
		return " must be " +  minlength + " characters";
	if (maxlength && input.length > maxlength)
		return " must be less than " + maxlength + " characters";
	return null;
}

// Custom validation functions =================================================
function isInvalidEmail (input) {
	var emailRegExp = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
	if (!emailRegExp.test(input)) return Messages.fieldErrors.isInvalid;
	return null;
};

function isInvalidPassword (input) {
	if (input.search(/[a-zA-Z]/) == -1)
		return Messages.fieldErrors.passwordLetter;
	if (input.search(/\d/) == -1)
		return Messages.fieldErrors.passwordNumber;
	return null;
};

// Exports =====================================================================

// Catch Errors: returns possible errors from an error of validation functions
module.exports.catchErrors = function (errors, callback) {
	var errorMessage = getErrorsFromArray(errors);
	if (errorMessage) return Secretary.requestError(errorMessage);
	return null;
};

module.exports.email = function (name, input) {
	var error = getErrorsFromArray([
		isInvalidString(input),
		isInvalidEmail(input)
	]);
	if (error) return name + error;
	return null;
};

module.exports.password = function (name, input) {
	var error = getErrorsFromArray([
		isInvalidString(input),
		isProperLength(input, 8),
		isInvalidPassword(input)
	]);
	if (error) return name + error;
	return null;
};

module.exports.string = function (name, input) {
	var error = isInvalidString(input);
	if (error) return name + error;
	return null;
};