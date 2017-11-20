/** @namespace tools/Paging */
// Paging.js: reusable database paging function

// Initialize dependencies
const Async = require('async');
const Database = require('./Database');
const Validation = require('./Validation');

// Default paging options
const PageSize = 20;
const Sort = "asc";
const SortKey = "dateCreated";
const PageNumber = 0;

/**
 * Handles default paging behavior, uses Database to page object
 * @memberof tools/Paging
 * @param {Object} params
 * @param {Object} params.model Mongoose model object
 * @param {Object} params.query MongoDB query object
 * @param {Number} params.params Paging parameters
 * @param {function (err, objects)} callback Callback function
 */
function pageObjects ({model, query, params}, callback) {

	// Synchronously perform the following tasks...
	Async.waterfall([

		// Validate possible paging fields, setup query
		function (callback) {

			// Collect provided fields for validation
			var fields = [];
			if (params.pageSize) fields.push(Validation.pageSize('Page size', params.pageSize));
			if (params.sort) fields.push(Validation.sort('Sort', params.sort));
			if (params.sortKey) fields.push(Validation.string('Sort key', params.sortKey));

			// Get field errors
			var err = Validation.catchErrors(fields);
			callback(err);
		},

		// Query database
		function (callback) {

			// Setup parameters from request
			var pageSize = (params.pageSize == null) ? PageSize : params.pageSize;
			var sort = (params.sort == null) ? Sort : params.sort;
			var sortKey = (params.sortKey == null) ? SortKey : params.sortKey;
			var pageNumber = (params.pageNumber == null) ? PageNumber : params.pageNumber;

			// Setup pageSort with sort and sortKey
			var pageSort = "";
			if (sort == "desc") pageSort += '-';
			pageSort += sortKey;

			Database.page({
				'model': model,
				'query': query,
				'pageSize': pageSize,
				'sort': pageSort,
				'skip': pageNumber*pageSize,
			}, function (err, objects) {
				callback(err, objects);
			})
		},

	], function (err, objects) {
		callback(err, objects);
	});
}

module.exports = {
	pageObjects: function ({model, query, params}, callback) {
		pageObjects({model, query, params}, callback);
	},
};