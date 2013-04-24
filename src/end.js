var ret = {

    compileStandaloneFromString: function( str, name, transformer ) {
        name = name || "myTemplate";
        var ret = this.fromString( str ).extract( name );
        return typeof transformer === "function" ? transformer(ret) : ret;
    },
    
    compileStandaloneFromFile: function( fileName, name, transformer ) {
        name = name || "myTemplate";
        var ret = this.fromFile( fileName ).extract( name );
        return typeof transformer === "function" ? transformer(ret) : ret;
    },
    
    registerGlobals: function() {
        for( var i = 0; i < arguments.length; ++i ) {
            globalsAvailable[arguments[i]] = true;
        }
        return this;
    },

    fromString: function( str ) {
        if( typeof str !== "string" ) {
            throw new TypeError( "Expecting string, got "+str );
        }
        return parse( str );
    },

    fromFile: function( name ) {
        var fromString = this.fromString,
            data,
            tmpl;

        if( compiledTemplates[name] ) {
            return compiledTemplates[name];
        }

        data = require("fs").readFileSync( name, "utf8" );

        tmpl = fromString( data );
        return compiledTemplates[name] = tmpl;
    },

    getById: function( id ) {
        var template;

        id = id + "";

        if( compiledTemplates[id] ) {
            return compiledTemplates[id];
        }

        template = document.getElementById(id);

        if( template == null ) {
            throw new TypeError( "Cannot find template by id: " +id);
        }

        return (compiledTemplates[id] = this.fromString( template.innerHTML ) );
    }
};

if( typeof module !== "undefined" && module.exports ) {
    module.exports = ret;
}
else if ( typeof define === "function" && define.amd && define.amd.attemplate ) {
    define( "attemplate", [], function () { return ret; } );
}
else if ( global ) {
    global.template = ret;
}

})(this);