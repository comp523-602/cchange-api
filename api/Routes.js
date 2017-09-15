
// Attach middleware and all routing files to server
module.exports = function (server) {

	// All Requests
	server.all('/', function (request, response, next) {

	});

	require('./routes/Authentication')(server);
};