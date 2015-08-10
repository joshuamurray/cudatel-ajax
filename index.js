/**
 * Primary requirements
 * @type {Storage|exports}
 */
var Storage = require( "storage.json" );

/**
 * The instance of the AjaxStream module.
 */
var stream;

/**
 * Creates a new configuation file if one does not yet exist.
 */
var bootstrap = function(){
    var config = {
        def_env: "local",
        local: {
            host: "<Local CudaTel Address/IP>",
            def_user: {
                user: "<CudaTel Username>",
                pass: "<CudaTel Password>"
            }
        },
        remote: {
            host: "<Remote CudaTel Address/IP>",
            def_user: {
                user: "<CudaTel Username>",
                pass: "<CudaTel Password>"
            }
        }
    };

    var configFile = new Storage( "cudatel-ajax" );

    configFile.load( null, function( loaded ){
        if( Object.getOwnPropertyNames( loaded).length == 0 ) configFile.push( config, function( created ){
            if( created[ "def_env" ]) console.log( "cudatel-ajax.json file created." );
        });

        stream = require( "./lib/stream" );

        module.exports = stream;
    });
}

bootstrap();



