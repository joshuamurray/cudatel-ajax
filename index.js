/**
 * Primary requirements
 * @type {Storage|exports}
 */
var Storage = require( "storage.json" );

/**
 * The instance of the AjaxStream module.
 */
var stream = require( "./lib/stream" );

/**
 * Exporting the Stream instance.
 * @type {stream|*|exports}
 */
module.exports = stream;

var bootstrap = function(){}

bootstrap();



