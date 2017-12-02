/** @namespace tools/Validation */
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

function getNamedErrorFromArray (errors, name) {
	var error = getErrorsFromArray(errors);
	if (error) return name + error;
	return null;
};

// Type validation functions ===================================================
function isInvalidString (input) {
	if (input === null || input === undefined)
		return Messages.fieldErrors.missing;
	if (!(typeof input === 'string' || input instanceof String))
		return Messages.typeErrors.string;
	if (input == "")
		return Messages.typeErrors.emptyString;
	return null;
};

function isInvalidNumber (input) {
	if (input === null)
		return Messages.fieldErrors.missing;
	if (!(typeof input === 'number'))
		return Messages.typeErrors.number;
	return null;
};

function isInvalidArray (input) {
	if (!(input instanceof Array))
		return Messages.typeErrors.array;
	return null;
};

// String validation functions =================================================
function isInvalidLength (input, minlength, maxlength) {
	if (minlength && input.length < minlength)
		return " must be " +  minlength + " characters";
	if (maxlength && input.length > maxlength)
		return " must be less than " + maxlength + " characters";
	return null;
}

// Number validation functions =================================================
function isInvalidSize (input, min, max) {
	if (min !== undefined && input < min)
		return " must be greater than " + min;
	if (max !== undefined && input > max)
		return " must be less than " + max;
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

function isInvalidSort (input) {
	if (
		input == "asc" ||
		input == "desc"
	) return null;
	return Messages.fieldErrors.sortKey;
};

function isInvalidImageURL (input) {
	var urlRegExp = new RegExp(/^https?:\/\/(?:[a-z\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png)$/);
	if (!urlRegExp.test(input)) return Messages.fieldErrors.invalidImageURL;
	return null;
};

// Exports =====================================================================

/**
 * Returns an error config object for the first in an array of errors
 * @memberof tools/Validation
 * @param {Array} errors Array of error messages
 * @return {Object} Error config object (or null)
 */
module.exports.catchErrors = function (errors) {
	var errorMessage = getErrorsFromArray(errors);
	if (errorMessage) return Secretary.requestError(errorMessage);
	return null;
};

/**
 * Returns error with email input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.email = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidString(input),
		isInvalidEmail(input)
	], name);
};

/**
 * Returns error with password input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.password = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidString(input),
		isInvalidLength(input, 8),
		isInvalidPassword(input)
	], name);
};

/**
 * Returns error with string input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.string = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidString(input),
	], name);
};

/**
 * Returns error with number input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.number = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidNumber(input),
	], name);
};

/**
 * Returns error with positive number input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.positiveNumber = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidNumber(input),
		isInvalidSize(input, 0),
	], name);
};

/**
 * Returns error with currency input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.currency = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidNumber(input),
		isInvalidSize(input, 1, 10000)
	], name);
};

/**
 * Returns error with pageSize input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {Number} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.pageSize = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidNumber(input),
		isInvalidSize(input, 1, 20),
	], name);
};

/**
 * Returns error with sort input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.sort = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidString(input),
		isInvalidSort(input),
	], name);
};

/**
 * Returns error with image URL input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {String} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.imageUrl = function (name, input) {
	return getNamedErrorFromArray([
		isInvalidString(input),
		isInvalidImageURL(input),
	], name);
};

/**
 * Returns error with image URL array input
 * @memberof tools/Validation
 * @param {String} name Name of field
 * @param {Array} input Field input
 * @return {Object} Error message (or null)
 */
module.exports.imageUrlArray = function (name, input) {
	if (isInvalidArray(input)) return getNamedErrorFromArray([
		isInvalidArray(input),
	], name);
	for (var i in input) {
		var error = getNamedErrorFromArray([
			isInvalidString(input[i]),
			isInvalidImageURL(input[i]),
		], name+'['+i+']');
		if (error) return error;
	};
	return null;
};