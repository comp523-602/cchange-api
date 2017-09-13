
// Initialize dependencies
const Express = require('express');
const Mongoose = require('mongoose');
const Async = require('async');

// Initialize config
const config = require('./config');

// Initialize server
const server = Express();

// Startup functions ===========================================================

// Start Database: connects to database using config settings
function startDatabase (callback) {
	console.log('Connecting to database...');

	// Connect to database
	Mongoose.connect(config.database, {
		'useMongoClient': true,
	});

	// Callback upon success
	Mongoose.connection.once('open', function () {
		console.log('Connected to database!')
		callback();
	});

	// Listen for error
	Mongoose.connection.on('error', console.error.bind(console, 'Database error:'))
};

// Start Server: listens to ip:port using config settings
function startServer (callback) {
	console.log('Starting server...')
	server.listen(config.port, config.ip, function () {
		console.log('Server listening on '+config.ip+':'+config.port+'...');
		callback();
	})
};

// Run startup functions =======================================================

Async.waterfall([

	function (callback) {
		startDatabase(function () {
			callback();
		})
	},

	function (callback) {
		startServer(function () {
			callback();
		});
	},

], function (err) {

});
