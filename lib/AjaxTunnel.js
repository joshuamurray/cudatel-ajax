/**
 * Primary Module Requirements.
 * @type {exports}
 */
var util = require( "util" );
var error = require( "./error" );
var events = require( "events" );
var request = require( "request" );
var storage = require( "storage.json" );

/**
 * Create a multi-level uri query string from a JSON object.
 * @param object
 * @param prefix
 * @returns {string}
 */
var serialize = function( object, prefix ) {
    var query = [];

    for( var property in object ) {
        if ( object.hasOwnProperty( property )) {
            var key = prefix ? prefix + "[" + property + "]" : property, value = object[ property ];
            query.push( typeof value == "object"
                    ? serialize( value, key )
                    : encodeURIComponent( key ) + "=" + encodeURIComponent( value )
            );
        }
    }

    return query.length > 0 ? "?" + query.join( "&" ) : "";
}

/**
 * Asynchronous JavaScript and XML request module for interaction with a CudaTel Server.
 * @constructor
 */
var AjaxTunnel = function( config ){
    var $this = this;
    events.EventEmitter.call( this );

    /**
     * The "hostname" or "IP address" of the CudaTel Server to send requests to.
     * @type {string}
     */
    this.cudaTelHost;

    /**
     * Authentication data for the CudaTel Server.
     * @type {{__auth_user: number, __auth_pass: number}}
     */
    this.cudaTelUser;

    /**
     * Default Path for storage of session data.
     */
    this.defaultPath;

    /**
     * Default Headers sent to the CudaTel Server with each request.
     * Replaces the need for a reverse-proxy for "AJAX" requests.
     * Provides the CudaTel Server with allowed header values.
     * @type {{
     *     Host: string,
     *     Connection: string,
     *     Accept: string,
     *     X-Requested-With: string,
     *     User-Agent: string,
     *     DNT: string,
     *     Referer: string,
     *     Accept-Encoding: string,
     *     Accept-Language: string
     * }}
     */
    this.defaultHead;

    /**
     * CudaTel "sessionid" string.
     */
    this.cudaSession;

    /**
     * Handle sending the request, after completed callback will be
     * fired with parsed "sessionId" and "body.data" parameters.
     * @param uri
     * @param data
     * @param callback ( sessionId, data )
     */
    this.send = function( uri, callback, data ){
        var postExecution = $this.afterValidRequest;

        if( uri.indexOf( "gui/login/" ) != -1 ) postExecution = $this.afterAuthRequests;

        var options = $this.getRequestOptions( uri, data );
        var execute = request[ options.method.toLowerCase()];

        execute( options, function( error, response, body ){
            if( error ) return error( body, response.statusCode );

            if( typeof body == "string" ) body = JSON.parse( body.trim());
            var data = body;

            return postExecution( data, response, callback );
        });
    }

    /**
     * Initiates the ajax pass-through connection.
     * @param cudaTelUser : { user: <CudaTel user>, pass: <CudaTel pass> }
     * @param callback
     */
    this.open = function( cudaTelUser, callback ){
        $this.cudaTelUser = {
            __auth_user: cudaTelUser.user,
            __auth_pass: cudaTelUser.pass
        };

        $this.getSessionOrLogin( callback );
    };

    /**
     * Returns a valid sessionid string. If this value is not already set,
     * this function performs a login request to obtain new session id
     * data from the CudaTel. CudaTel "sessionid" is 40 characters.
     * @param callback
     */
    this.getSessionOrLogin = function( callback ){
        $this.loadSessionInFile( function( sessionId ){
            if( ! sessionId ) return $this.startLoginRequest( callback );

            $this.cudaSession = sessionId;

            $this.startCheckRequest( callback );
        });
    };

    /**
     * Performs a login request prior to firing the callback.
     * **wrapper to describe actions
     * @param callback
     */
    this.startLoginRequest = function( callback ){
        $this.send( "/gui/login/login", callback );
    };

    /**
     * Performs a status request prior to firing the callback.
     * **wrapper to describe actions
     * @param callback
     */
    this.startCheckRequest = function( callback ){
        $this.send( "/gui/login/status", callback );
    };

    /**
     * Saves the session value into the cookie Storage file.
     */
    this.saveSessionInFile = function( data, callback ){
        if( ! data || ! $this.cudaSession ) callback( false );

        var user = data.bbx_user_username;
        data.last_sessionid = $this.cudaSession;

        storage.save( user, data, callback );
    }

    /**
     * Destroys the session value from the cookie Storage file.
     */
    this.wipeSessionInFile = function( sessionId, callback ){
        var user = $this.cudaTelUser.__auth_user;

        storage.wipe( user, function( wiped ){
            if( ! wiped ) return error( "Can't delete that from the file." );

            callback( sessionId, true );
        });
    }

    /**
     * Loads the session value from the cookie Storage file.
     */
    this.loadSessionInFile = function( callback ){
        var user = $this.cudaTelUser.__auth_user;

        storage.load( user, function( loaded ){
            loaded = loaded.last_sessionid || false;

            callback( loaded );
        });
    };

    /**
     * Returns the options for the "request" method call.
     * @param uri
     * @returns {{jar: boolean, json: boolean, method: string, form: {__auth_user: number, __auth_pass: number}, url: string, headers: *}}
     */
    this.getRequestOptions = function( uri, data ){
        var login = uri.indexOf( "login/log" ) != -1;

        var options = {
            url: "http://"+ $this.cudaTelHost + uri + $this.buildRequestQuery( data, login ),
            jar: true,
            json: true,
            method: login ? "POST" : "GET",
            form: login ? $this.cudaTelUser : null,
            headers: $this.getRequestHeaders( login )
        }

        return options;
    };

    /**
     * Creates a query string for "GET" requests, based on the "data" object.
     * @param data
     */
    this.buildRequestQuery = function( data, isLogin ){
        data = data || {};

        if( ! isLogin ) data.sessionid = $this.cudaSession;

        return data ? serialize( data ) : "";
    }

    /**
     * Returns CudaTel specific header object form teh "request" method call
     */
    this.getRequestHeaders = function( isLogin ){
        if( ! isLogin && ! $this.defaultHead.Cookie ) $this.defaultHead.Cookie = "bps_session="+ $this.cudaSession +";";

        return $this.defaultHead;
    };

    /**
     * Saves Authentication information from a "login" request.
     * @param data
     * @param response
     * @param callback
     * @returns {*}
     */
    this.afterAuthRequests = function( data, response, callback ){
        if( response.request.uri.href.indexOf( "login/logout" ) != -1 ) return $this.gotLogoutResponse( callback );

        if( data.error && data.error == 'NOTAUTHORIZED' ) return $this.startLoginRequest( callback );

        $this.responseSetCookie( data.data, response, function( saved ){
            if( ! saved ) return error( "Unable to save session data to file." );

            callback( $this.cudaSession, data.data );
        });
    };

    /**
     * Fires the callback with logout information.
     * @param callback
     */
    this.gotLogoutResponse = function( callback ){
        $this.wipeSessionInFile( $this.cudaSession, callback );
    }

    /**
     * When a "login" request is made the cookie and session data are stored here.
     * @param response
     */
    this.responseSetCookie = function( data, response, callback ){
        var cookie = response.headers[ "set-cookie" ][0] || false;

        $this.cudaSession = cookie.substr( 12, 40 );

        $this.saveSessionInFile( data, callback );
    };

    /**
     * Handles request response for any request that is not for authentication.
     * @param data
     * @param response
     * @param callback
     * @returns {*}
     */
    this.afterValidRequest = function( data, response, callback ){
        callback( $this.cudaSession, data );
    };

    /**
     * Must be called to save the session data to another location. Defaults to current directory.
     * @param relativePath
     */
    this.setSessionFilePath = function( relativePath ){
        var path = relativePath || $this.defaultPath;

        storage.file( path );
    }

    /**
     * The module bootstrap command.
     */
    this.boot = function( config ){
        $this.ajax.setSessionFilePath( config.session_file_path );
        $this.env = config.def_env;
        $this.cudaTelHost = config[ $this.env ].host;
        $this.defaultHead = {
            "Host": $this.cudaTelHost,
            "Origin": "http://"+ $this.cudaTelHost,
            "Referer": "http://"+ $this.cudaTelHost +"/"
        };
    };

    /**
     * Execute the module bootstrap command ( on instantiation )
     */
    $this.boot( config );
}

/**
 * AjaxTunnel inheritance from the EventEmitter module
 * @type {Object|Function|exports.EventEmitter}
 * @private
 */
util.inherits( AjaxTunnel, events.EventEmitter );

/**
 * Exporting the helper functions
 * @type {{send: Function, fire: Function}}
 */
module.exports = AjaxTunnel;