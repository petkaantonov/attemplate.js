var HelperBlock = TemplateExpressionParser.yy.HelperBlock = (function() {
    var _super = ScopedBlock.prototype,
        method = HelperBlock.prototype = Object.create(_super);
        
    var id = "___helper___";
    
    method.constructor = HelperBlock;
    
    function HelperBlock( name, parameterNames ) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.parameterNames = parameterNames;
        
    }
      
    method.performAnalysis = function( parent ) {
        var vars = this.getVariables();
        for( var key in vars ) {
            if( vars.hasOwnProperty(key) && !this.hasHelper(key)) {
                vars[key].setReferenceMode( MemberExpression.referenceMode.SELF_ONLY );
            }
        }
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            if( statement instanceof Block ) {
                statement.performAnalysis( this );
            }
            else if( statement.performAnalysis ) {
                statement.performAnalysis( this );
            }
        }
    };
    
    method.setIndentLevel = function( level ) {
        this.indentLevel = level;
        for( var i = 0; i < this.statements.length; ++i ) {
            this.statements[i].setIndentLevel( level + 2 );
        }
    };
    //No need to merge the variabls that are declared in parameters
    //Other helper names cannot be known at this time
    method.mergeVariables = function( referenceExpressionMap ) {
        var vars = this.getVariables();
        
        for( var key in referenceExpressionMap ) {
            if( referenceExpressionMap.hasOwnProperty( key ) &&
                this.parameterNames.indexOf( key ) < 0 &&
                !vars.hasOwnProperty(key) ) {
                vars[key] = referenceExpressionMap[key];
            }
        }
    };
    
    method.toString = function() {
        var codes = [],
            ret,
            references = this.getReferences();
        
        var indent = this.getIndentStr();
        
        for( var i = 0; i < this.statements.length; ++i ) {
            codes.push( this.statements[i].toString() );
        }
        
        return this._toString(
            this.name,
            id,
            this.parameterNames.join(", "),
            ( references.length ? "var " + references.join(", \n" + indent + "        ") + ";\n" : ""),
            codes.join("\n"),
            HtmlContextParser.context.HTML.name
        
        );
        
    };
    
    method._toString = MACRO.create(function(){
    
    
var $1 = (function() {
    function $2($3) {
        $4
        var ___html = '';
$5
        return new ___Safe(___html, $6);
    }
    
    return function() {
        return $2.apply(___self, arguments);
    };
})();


});
    
    method.getParameterNames = function() {
        return this.parameterNames;
    };
    
    method.getName = function() {
        return this.name;
    };
    
    return HelperBlock;
})();