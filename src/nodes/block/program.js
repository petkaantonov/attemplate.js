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
    
    method.putCloneProps = function( clonedObj ) {
        _super.putCloneProps.call( this, clonedObj );
        clonedObj.importName = this.importName;
        clonedObj.aliasedImportName = this.aliasedImportName;
        clonedObj.isBeingImported = this.isBeingImported;
    };
    
    method.asHelper = function( importName, aliasedImportName ) {
        var ret = new Program();
        this.putCloneProps( ret );
        ret.aliasedImportName = aliasedImportName || null;
        ret.importName = importName;
        ret.isBeingImported = true;
        return ret;
    };

    method.performAnalysis = function( parent ) {
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
    
        var ret = this._toStringHelper(
            this.getHelperCode(),
            idName,
            this.referenceAssignment( false ),
            this.getCode(),
            HtmlContextParser.context.HTML.name
        );
                           
        this.isBeingImported = false;
        return ret;
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
            importCodes = [];
                

        ret.push( programInitBody );
        ret.push( this.getHelperCode() );
        var indent = this.getIndentStr();
        
        
        imports.forEach( function( primaryExportName, aliasedNames ) {
            if( aliasedNames != null ) { //Continue with regular helpers
                var importCode = exported.get( primaryExportName ).toImportCode();
                    
                var varDeclarationCode = indent + "var "+ primaryExportName + (aliasedNames.length ? ",\n    " +
                        indent + aliasedNames.join(",\n    " + indent)+";" : ";");
                        
                var assignmentCode = "\n" + indent + primaryExportName + 
                            (aliasedNames.length ? " = "+ aliasedNames.join(" = " )+ " = " 
                            + importCode : " = " + importCode);
                    
                    
                importCodes.push( varDeclarationCode, assignmentCode );
                
            }
        });

        ret.push( importCodes.join("\n") );
        
        ret.push( this._toStringProgram(
            idName,
            this.referenceAssignment( true ),
            this.getCode()
        ));
                
        return ret.join("\n");
    };
    
    
    method._toStringProgram = MACRO.create(function(){
    
function $1( ___data ) {
    if( !___r ) {
        throw new Error('No registered runtime');
    }
    ___self = ___r.Object(___data);
    ___r.setCallContext(___self);
    var ___html = '', ___context = null, ___ref, ___ref2;
    $2
$3
    return ___html;
}

$1.registerRuntime = function(rt) {
    ___setRuntime(rt);
};

return $1;

});

    method._toStringHelper = MACRO.create(function(){
(function() {
$1
    function $2(____data) {
        var ___data = ___r.Object( ____data );
        var ___html = '', ___context = null, ___ref, ___ref2;
        $3
$4
        return new ___r.Safe(___html, $5);
    }
    
    return $2;
})();
});
    
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
        Identifier.refreshReferenceMap();
        FunctionCall.flush();
    };
    
    return Program;
})();