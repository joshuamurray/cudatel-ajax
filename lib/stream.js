var util = require( "util" );
var events = require( "events" );
var Storage = require( "storage.json" );
var AjaxTunnel = require( "./AjaxTunnel" );

/**
 * The instantiation of the AjaxStream.
 */
var stream;

/**
 * Simple interface module to allow for easily accessible ajax requests in singularity, or bulk.
 * Primary functions:
 *     open([ userObject ], callback ) : Authenticates the user. Callback is provided {string}sessionId and {object}data from the response.,
 *     send( uri, data, callback ) : Send the request to the provided uri. Callback is provided {string}sessionId and {object}data from the response,
 *     shut( callback ) : Log out, detroy all record of sessionId. Callback is provided {string}sessionId and {boolean}logout successful
 * @param env
 * @constructor
 */
var AjaxStream = function( env ){
    var $this = this;
    events.EventEmitter.call( this );

    this.env;
    this.ajax;
    this.config;
    this.configFile;

    /**
     * Opens the ajax stream session ( logs the user in )
     * @param callback
     */
    this.open = function( user, callback ){
        if( typeof user == "function" ){
            callback = user;
            user = $this.config[ $this.env ].def_user;
        }

        $this.ajax.open( user, callback );
    }

    /**
     * Sends an ajax request to the uri. Callback is fired with "sessionId" and "data" variables.
     * If data is sent with the request, it will be set as a query string for the GET request.
     * @param uri
     * @param data
     * @param callback
     */
    this.send = function( uri, data, callback ){
        callback = typeof data == "function" ? data : callback;
        data = typeof data == "object" ? data : {};

        $this.ajax.send( uri, callback, data );
    }

    /**
     * Closes the ajax stream session ( logs the user out )
     * @param callback
     */
    this.shut = function( callback ){
        $this.ajax.send( "/gui/login/logout", callback );
    }

    /**
     * The module bootstrap command.
     * @param env
     */
    this.boot = function( env ){
        $this.configFile = new Storage( "../cudatel-ajax/cudatel-ajax" );
        $this.configFile.load( null, function( config ){
            $this.streaming = 0;
            $this.config = config;
            $this.env = env || $this.config.def_env;
            $this.ajax = new AjaxTunnel( $this.config[ $this.env ].host );
            $this.emit( "ready", $this );
        });
    };

    /**
     * Execute the module bootstrap command.
     */
    $this.boot( env );
};

/**
 * Storage inheritance from the EventEmitter module
 * @type {Object|Function|exports.EventEmitter}
 * @private
 */
util.inherits( AjaxStream, events.EventEmitter );

/**
 * Module instantiation command.
 */
var bootstrap = function(){
    stream = new AjaxStream();
}

/**
 * Execute the module instantiation command.
 */
bootstrap();

/**
 * Exports an instantiation of the AjaxStream module.
 */
module.exports = stream;

