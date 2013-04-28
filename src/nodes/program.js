var Program = (function() {
    var _super = ScopedBlock.prototype,
        method = Program.prototype = Object.create(_super);
    
    method.constructor = Program;
    
    var idName = "___template___";
    
    function Program() {
        _super.constructor.apply(this, arguments);
        this.importName = null;
        this.aliasedImportName = null;
        this.isBeingImported = false;
    }
        
    method.getImportName = function() {
        return this.importName;  
    };
    
    method.getAliasedImportName = function() {
        return this.aliasedImportName;
    };
    
    method.asHelper = function( importName, aliasedImportName ) {
        var ret = new Program();
        for( var key in this ) {
            if( this.hasOwnProperty( key ) ) {
                ret[key] = this[key];
            }
        }
        ret.aliasedImportName = aliasedImportName || null;
        ret.importName = importName;
        ret.isBeingImported = true;
        return ret;
    };
    

    method.toImportCode = function() {
        this.isBeingImported = true;
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
        
        this.establishReferences( globalReferences, scopedReferences );

        ret.push( "(function() {" );
        
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }
        
        ret.push( this.getHelperCode() );
        
        ret.push( "function "+idName+"( ___data ) { ___data = ___data || {}; var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return new ___Safe(___html.join(''), 'HTML'); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(___self, data || {}); }; })();");
        this.isBeingImported = false;
        return ret.join("");
    };
    
    method.getHelperCode = function() {
        var ret = [], helper;
        for( var i = 0; i < this.helpers.length; ++i ) {
            helper = this.helpers[i];
            if( helper instanceof HelperBlock ) {
                ret.push( this.helpers[i].toString() );
            }
        }
        return ret.join("");
    };
    
    method.getCode = function() {
        var ret = [];
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        return ret.join("");
    };
    
    //@override
    method.toString = function( imports, exported ) {
        if( this.isBeingImported ) {
            return "";
        }
        
        var ret = [],
            scopedReferences = [],
            importCodes = [],
            globalReferences = [];
                
        this.establishReferences( globalReferences, scopedReferences );
        
        ret.push( programInitBody );
                
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }
        
        ret.push( this.getHelperCode() );
        
        for( var primaryName in imports ) {
            if( imports.hasOwnProperty( primaryName ) ) {

                if( imports[primaryName] == null ) { //Continue with regular helpers
                    continue;
                }
                var program = exported[primaryName],
                    aliases = imports[primaryName],
                    code = program.toImportCode(),

                    vars = "var "+ primaryName + (aliases.length ? ",\n" + aliases.join(",\n")+";" : ";"),
                    assignment = primaryName + (aliases.length ? " = " + aliases.join(" = ")+ " = " + code : " = " + code);

                importCodes.push( vars, assignment );
            }
        }
        
        ret.push( importCodes.join("") );
        
        ret.push( "function "+idName+"() { ___self = this; var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return ___html.join(''); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(data || {}); }; ");
        
        return ret.join("");
    };

    //@override
    method.getName = function() {
        return this.aliasedImportName || this.importName;
    };

    //@override
    method.shouldCheckDataArgument = function() {
        return this.isBeingImported;
    };
    
    return Program;
})();