/**
 * Primary module requirements.
 * @type {exports}
 */
var fs = require( "fs" );
var util = require( "util" );
var path = require( "path" );
var events = require( "events" );
var error = require( "./error" );

/**
 * Simple wrapper to force adding of whitespace
 * to JSON string, when writing it to a file.
 * @param string
 * @param spaces
 * @returns {*}
 */
JSON.stringForFile = function( string, spaces ){
    spaces = spaces || 2;

    return JSON.stringify( string, null, spaces );
}

/**
 * Handles storage of trivial data for requiring modules within a JSON file.
 * File will be created if it doesn't exist.
 * Primary functions: load( index ), save( index, value )
 * @param relativePath *REQUIRED
 * @constructor
 */
var Storage = function( relativePath ){
    var $this = this;
    events.EventEmitter.call( this );

    /**
     * Relative path provided upon instantiation
     */
    this.storagePath;

    /**
     * Saves the data into the JSON file
     * @param index
     * @param value
     * @param callback( saved = {boolean} )
     */
    this.save = function( index, value, callback ){
        $this.open( function( data ){
            data[ index ] = value;
            $this.push( data, function( data ){
                var saved = data[ index ] !== undefined;

                callback( saved );
            });
        });
    };

    /**
     * Loads the value of the index within this.storagePath file.
     * Returns {boolean} false if the index is not in the file.
     * @param index
     * @param callback ( value {*} )
     */
    this.load = function( index, callback ){
        $this.open( function( data ){
            if( ! index ) return callback( data );

            data = data[ index ] || false;

            callback( data );
        });
    };

    /**
     * Destroys data index from the file.
     * @param index
     * @param callback
     */
    this.wipe = function( index, callback ){
        $this.open( function( data ){
            delete data[ index ];

            $this.push( data, callback );
        });
    };

    /**
     * Returns the full path of the JSON storage file for the instance.
     */
    this.path = function(){
        return $this.storagePath;
    };

    /**
     * If the file exists at path, callback fires with this.read()
     * output. If not, callback fires with this.make() output.
     * @param callback
     * @returns {{}}
     */
    this.open = function( callback ){
        fs.exists( $this.path(), function( exists ){
            if( ! exists ) $this.make( callback );
            else $this.pull( callback );
        });
    };

    /**
     * Creates a new file containing a stringified, empty object at this.realtivePath.
     * @param data
     * @returns {*}
     */
    this.make = function( callback ){
        fs.open( $this.path(), 'w', function( error, fd ){
            if( error ) return error( "File create error", error.stack );

            $this.push( {}, callback );
        });
    }

    /**
     * Reads and parses the contents of the file at this.storagePath.
     * Returns {boolean} false if the file does not exist at path.
     * @returns {*}
     */
    this.pull = function( callback ){
        var readOptions = { encoding: "utf8" };

        fs.readFile( $this.path(), readOptions, function( error, contents ){
            if( error ) return error( "File read error", error.stack );

            callback( JSON.parse( contents ));
        });
    };

    /**
     * Stringifies and writes the file to this.storagePath.
     * @param data
     * @returns {*}
     */
    this.push = function( data, callback ){
        var writeOptions = { encoding: "utf8" };
        var prettyContents = JSON.stringForFile( data );

        fs.writeFile( $this.path(), prettyContents, writeOptions, function( error ){
            if( error ) return error( "File write error", error.stack );

            $this.pull( callback );
        });
    }

    /**
     * Sets the instance's path variable to the supplied "relativePath" value
     * @param path
     */
    this.lock = function( relativePath ){
        if( ! relativePath ) return error( "You must provide a path to create a \"Storage\" module." );

        if( relativePath.substr( path.length - 4 ) != ".json" ) relativePath += ".json";

        $this.storagePath = path.resolve( relativePath );
    };

    /**
     * The module's bootstrap function.
     * @param relativePath
     */
    this.boot = function( relativePath ){
        $this.lock( relativePath, function( contentObject ){
            if( typeof contentObject != "object" ) return error( "File lock error" );

            $this.file = contentObject;
        });
    };

    /**
     * Execute the module's bootstrap function on instantiation.
     */
    $this.boot( relativePath );
}

/**
 * Storage inheritance from the EventEmitter module
 * @type {Object|Function|exports.EventEmitter}
 * @private
 */
util.inherits( Storage, events.EventEmitter );

/**
 * Exports an instantiation of the Storage module.
 */
module.exports = Storage;