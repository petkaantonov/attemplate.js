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
        var ret = [],
            references = this.getReferences();
        
        ret.push( "var " + this.name + " = (function(){ function "+id+"("+this.parameterNames.join(", ")+") {" );
             
        if( references.length )  {
            ret.push( "var " + references.join(", \n") + ";");
        }
        
        ret.push( "var ___html = '';" );
        
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        
        ret.push( "return new ___Safe(___html, "+HtmlContextParser.context.HTML.name+"); } return function() {return "+id+".apply(___self, arguments); }; })();" );
        
        return ret.join( "" );
    };
    
    method.getParameterNames = function() {
        return this.parameterNames;
    };
    
    method.getName = function() {
        return this.name;
    };
    
    return HelperBlock;
})();