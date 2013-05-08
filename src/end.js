var ret = {

    compileStandaloneFromString: function( str, name) {
        name = name || "myTemplate";
        return this.fromString( str, name );
    },
    
    compileStandaloneFromFile: function( fileName, name ) {
        name = name || "myTemplate";
        return this.fromFile( str, name );
    },
    
    registerGlobals: function() {
        for( var i = 0; i < arguments.length; ++i ) {
            globalsAvailable[arguments[i]] = true;
        }
        return this;
    },

    fromString: function( str, compiledName ) {
        if( typeof str !== "string" ) {
            throw new TypeError( "Expecting string, got "+str );
        }
        return parse( str, compiledName  );
    },

    fromFile: function( name, compiledName  ) {
        var fromString = this.fromString,
            data,
            tmpl;

        if( compiledTemplates.has( name ) ) {
            return compiledTemplates.get( name );
        }

        data = require("fs").readFileSync( name, "utf8" );

        tmpl = fromString( data, compiledName );
        compiledTemplates.set( name, tmpl );
        return tmpl;
    },

    getById: function( id, compiledName  ) {
        var template;

        id = id + "";

        if( compiledTemplates.has( id ) ) {
            return compiledTemplates.get( id );
        }

        template = document.getElementById(id);

        if( template == null ) {
            throw new TypeError( "Cannot find template by id: " +id);
        }
        var tmpl = this.fromString( template.innerHTML, compiledName  );
        compiledTemplates.set( id, tmpl );
        return tmpl;
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