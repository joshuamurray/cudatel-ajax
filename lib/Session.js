var util = require( "util" );
var error = require( "./error" );
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
var Session = function(){
    var $this = this;
    events.EventEmitter.call( this );

    /**
     * The current environment ( "local", "remote" )
     */
    this.env;

    /**
     * The ajax request instance.
     */
    this.ajax;

    /**
     * The configuration options for this stream.
     */
    this.config;

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
    this.boot = function(){
        var configFile = "./config";
        var configDflt = __dirname + "/required.config"
        storage.get( configFile, configDflt, function( config ){
            $this.config = config;
            $this.env = env || $this.config.def_env;
            $this.ajax = new AjaxTunnel( config );
        });
    };

    /**
     * Execute the module bootstrap command.
     */
    $this.boot();
};

/**
 * Storage inheritance from the EventEmitter module
 * @type {Object|Function|exports.EventEmitter}
 * @private
 */
util.inherits( Session, events.EventEmitter );

/**
 * Exports an instantiation of the AjaxStream module.
 */
module.exports = Session;

