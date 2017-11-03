/** @namespace tools/Imaging */
// Imaging.js: used to create images

// Initialize dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const Async = require('async');
const Canvas = require('canvas');
const {Image} = require('canvas');
const Cloudinary = require('cloudinary');

// Initialize config
const config = require('./../../config');

// Setup Cloudinary
Cloudinary.config({
	cloud_name: config.cloudinary.cloud,
  	api_key: config.cloudinary.key,
  	api_secret: config.cloudinary.secret
})

// Functions ===================================================================
module.exports = {

	/**
	 * Creates a sharable image using a logo, campaign title and image
	 * @memberof tools/Imaging
	 * @param {Object} params
	 * @param {String} params.imageURL URL of cropped post image
	 * @param {String} params.logoURL URL of cropped charity logo
	 * @param {String} params.shareableText Text to be added to image
	 * @param {function (err, image)} callback Callback function
	 */
	createShareableImage: function ({imageURL, logoURL, shareableText}, callback) {

		// Setup canvas
		var canvas = new Canvas(480, 540);
		var ctx = canvas.getContext('2d');

		Async.waterfall([

			// Download post image
			function (callback) {

				// Setup requester
				if (imageURL.startsWith('https://')) requester = https;
				else requester = http;

				// Make response with requester
				requester.get(imageURL).on('response', function(res) {

					// Build array of chunks
					var chunks = [];
					res.on('data', function(data) {
						chunks.push(data)
					})

					// Build image with complete
					res.on('end', function() {
						var image = new Canvas.Image()
						image.src = Buffer.concat(chunks)
						callback(null, image)
					})

				}).on('error', function(err) {
					callback(err);
				});
			},

			// Download logo image
			function (image, callback) {

				// Check for logoURL
				if (logoURL) {

					// Setup requester
					if (logoURL.startsWith('https://')) requester = https;
					else requester = http;

					// Make response with requester
					requester.get(logoURL).on('response', function(res) {

						// Build array of chunks
						var chunks = [];
						res.on('data', function(data) {
							chunks.push(data)
						})

						// Build image with complete
						res.on('end', function() {
							var logo = new Canvas.Image()
							logo.src = Buffer.concat(chunks)
							callback(null, image, logo)
						})

					}).on('error', function(err) {
						callback(err);
					});
				}

				// Handle missing logoURL
				else {
					callback(null, image, null);
				}
			},

			// Draw canvas
			function (image, logo, callback) {

				// Add white background to canvas
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				// Add image to canvas
				ctx.drawImage(image, 0, 0, 480, 480);

				// Add logo to canvas if applicable
				if (logo) ctx.drawImage(logo, 415, 487, 45, 45);

				// Add text to canvas
				ctx.fillStyle = "black";
				ctx.font = "bold 20px Arial";
				ctx.fillText(shareableText, 20, 515);

				// Make callback
				callback();
			},

			// Upload image to Cloudinary
			function (callback) {
				Cloudinary.uploader.upload(canvas.toDataURL(), function (result) {
					if (result.error) {
						callback(result.error.message);
					} else {
						callback(null, result.url);
					}
				});
			},

		], function (err, shareableImageURL) {
			callback(err, shareableImageURL);
		});
	},
};