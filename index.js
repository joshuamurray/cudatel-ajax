var stream = require( "./lib/stream" );
var Storage = require( "storage.json" );

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

    configFile.load( "def_env", function( loaded ){
        if( ! loaded ) configFile.push( config, function( created ){
            if( created[ "def_env" ]) console.log( "cudatel-ajax.json file created." );
        });
    });
}

bootstrap();

module.exports = stream;