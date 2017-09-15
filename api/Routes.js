
// Attach middleware and all routing files to server
module.exports = function (server) {

	// Welcome
	server.get('/', function (request, response, next) {
		console.log('Welcome to the cChange API');
	});

	require('./routes/Authentication')(server);
};