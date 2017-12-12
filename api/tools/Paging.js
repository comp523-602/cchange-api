/** @namespace tools/Paging */
// Paging.js: reusable database paging function

// Initialize dependencies
const Async = require('async');
const Database = require('./Database');
const Validation = require('./Validation');
const Secretary = require('./Secretary');

// Default paging options
const PageSize = 20;
const Sort = "desc";
const SortKey = "dateCreated";
const PageNumber = 0;

module.exports = {

	/**
	 * Handles default paging behavior, uses Database to page object
	 * @memberof tools/Paging
	 * @param {Object} params
	 * @param {Object} [params.model] Mongoose model object (optional if models provided)
	 * @param {Array} [params.models] Array of Mongoose model objects (optional of model provided)
	 * @param {Object} params.query MongoDB query object
	 * @param {Object} params.params Paging parameters
	 * @param {function (err, objects)} callback Callback function
	 */
	pageObjects: function ({model, models, query, params}, callback) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate possible paging fields, setup query
			function (callback) {

				// Collect provided fields for validation
				var fields = [];
				if (params.pageSize) fields.push(Validation.pageSize('Page size', params.pageSize));
				if (params.sort) fields.push(Validation.sort('Sort', params.sort));
				if (params.sortKey) fields.push(Validation.string('Sort key', params.sortKey));
				if (params.pageNumber) fields.push(Validation.number('Page number', params.pageNumber));

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

				// Handle multiple queries
				if (models) {

					// Initialize array of objects
					var allObjects = [];

					// Make query for each model
					Async.each(models, function (model, callback) {
						Database.find({
							'model': model,
							'query': query,
						}, function (err, objects) {
							if (objects) for (var i in objects) allObjects.push(objects[i]);
							callback(err);
						});
					}, function (err) {

						// Sort and limit query
						allObjects = allObjects.sort(function (a, b) {
							if (sort == "asc") {
								if (a[sortKey] < b[sortKey]) return -1;
								else if (a[sortKey] > b[sortKey]) return 1;
								return 0;
							} else {
								if (a[sortKey] < b[sortKey]) return 1;
								else if (a[sortKey] > b[sortKey]) return -1;
								return 0;
							}
						}).splice(pageSize*pageNumber, (pageSize*pageNumber)+pageSize);
						callback(err, allObjects)
					})
				}

				// Handle single query
				else if (model) {

					// Using paging function
					Database.page({
						'model': model,
						'query': query,
						'pageSize': pageSize,
						'sort': pageSort,
						'skip': pageNumber*pageSize,
					}, function (err, objects) {
						callback(err, objects);
					});
				}

				else {
					callback(Secretary.serverError('Paging function error'));
				}
			},

		], function (err, objects) {
			callback(err, objects);
		});
	},
};