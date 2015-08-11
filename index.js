/**
 * Primary module requirements
 */
var stream = require( "./lib/stream" );

/**
 * Called PRIOR TO export to ensure that all variable values from "config.json"
 * have been loaded. Sets all initial variables to their respective values.
 * Instantiates any modules requiring instantiation, prior to exporting.
 */
var bootstrap = function(){}

/**
 * Execute the bootstrap command before exporting
 */
bootstrap();

/**
 * Exporting the Stream instance.
 * @type {stream|*|exports}
 */
module.exports = stream;



