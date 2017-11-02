/** @namespace tools/Imaging */
// Imaging.js: used to create images

// Initialize dependencies
const Fabric = require('fabric');
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
	 * @param {String} params.campaignTitle Title of campaign to be added to image
	 * @param {function (err, image)} callback Callback function
	 */
	createShareableImage: function ({imageURL, logoURL, campaignTitle}, callback) {

	},

	/**
	 * Uploads an image to Cloudinary
	 * @memberof tools/Imaging
	 * @param {Object} image Javascript image representation
	 * @param {function (err, url)} callback Callback function
	 */
	uploadToCloudinary: function (image, callback) {

	},
};