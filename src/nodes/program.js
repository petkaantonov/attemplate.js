var Program = TemplateExpressionParser.yy.Program = (function() {
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

    method.performAnalysis = function( parent ) {
        var vars = this.getVariables();
        for( var key in vars ) {
            if( vars.hasOwnProperty(key) && !this.hasHelper(key) ) {
                vars[key].setReferenceMode(
                    this.isBeingImported ?
                    MemberExpression.referenceMode.DATA_ARGUMENT : 
                    MemberExpression.referenceMode.SELF_ONLY
                );
            }
        }
        _super.performAnalysis.call( this, parent );
    };
    
    method.setIndentLevel = function( level ) {
        this.indentLevel = level;
        
        if( !this.isBeingImported ) {
            _super.setIndentLevel.call( this, level );
        }
        else {
            for( var i = 0; i < this.statements.length; ++i ) {
                this.statements[i].setIndentLevel( level + 2 );
            }
        }
        return this;
    };

    method.toImportCode = function() {
        this.isBeingImported = true;
        var ret = [],
            references = this.getReferences();
            
            
        var indent = this.getIndentStr();
        
        ret.push( "(function() {\n" );

        
        ret.push( this.getHelperCode() );
        
        ret.push( indent + "    function "+idName+"( ___data ) {\n" +
            indent + "        ___data = ___data || {};\n"+
            indent + "        var ___html = '';\n" );
        
        if( references.length )  {
            ret.push( indent + "        var " + references.join(", \n" +indent + "            ") + ";\n");
        }
        
        ret.push( this.getCode() );
        
        ret.push( indent + "        return new ___Safe(___html, "+HtmlContextParser.context.HTML.name+");\n    "+
            indent+ "}\n\n" );
        
        ret.push( indent + "    return function( data ) {\n" +
                    indent + "        return "+idName+".call(___self, data || {});\n"+
                    indent + "    };\n"+ 
                    indent + "})();\n");
                    
                    
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
            references = this.getReferences(),
            importCodes = [];
                

        ret.push( programInitBody );
        ret.push( this.getHelperCode() );
        var indent = this.getIndentStr();
        
        for( var primaryName in imports ) {
            if( imports.hasOwnProperty( primaryName ) ) {

                if( imports[primaryName] == null ) { //Continue with regular helpers
                    continue;
                }
                var program = exported[primaryName],
                    aliases = imports[primaryName],
                    code = program.toImportCode(),

                    vars = indent + "var "+ primaryName + (aliases.length ? ",\n    " + indent + aliases.join(",\n    " + indent)+";\n" : ";\n"),
                    assignment = "\n" + indent + primaryName + 
                        (aliases.length ? " = "+ aliases.join(" = " )+ " = " 
                        + code : " = " + code);

                importCodes.push( vars, assignment );
            }
        }
        
        
        
        ret.push( "\n" + importCodes.join("")  + "\n" );
        
        ret.push( indent + "function "+idName+"() {\n" +
            indent + "    if( !___runtime) {\n"+
            indent + "        throw new Error('No registered runtime');\n"+
            indent + "    }\n"+
            indent + "    ___self = this;\n"+
            indent + "    var ___html = '';\n" );
        
        if( references.length )  {
            ret.push( indent + "    var " + references.join(", \n" + indent + "        ") + ";\n");
        }
        
        ret.push( this.getCode() );
        
        ret.push( indent + "    return ___html;\n" + indent + "}\n" );
        
        ret.push( indent + "var ret = function( data ) {\n"+
                indent +  "    return "+idName+".call(data || {});\n"+
                indent + "};\n"+
                indent + "ret.registerRuntime = function( rt ) {\n"+
                indent + "    ___setRuntime(rt);\n"+
                indent + "};\n"+
                indent + "return ret;"
        );
        
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
    
    //Clean static state that becomes corrupted in case of errors
    Program.cleanStaticState = function() {
        MemberExpression.identifiers = {};
    };
    
    return Program;
})();