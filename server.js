
// Initialize dependencies
const express = require('express');

// Initialize config
const config = require('./config');

// Setup server
const server = express();

server.get('/', function (req, res) {
  res.send('Hello World!')
})

server.listen(config.port, config.ip, function () {
  console.log('cChange API running on port 3000');
})