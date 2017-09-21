
// Dates.js: provides tools for generating / handling dates

// Initialize dependencies
const Moment = require('moment');

module.exports = {
	now: function () {
		return Moment().format('X');
	},
	fromNow: function (num, string) {
		return Moment().add(num, string).format('X');
	},
};