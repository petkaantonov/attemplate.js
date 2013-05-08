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
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            this.statements[i].performAnalysis( this );
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
    method.mergeReferences = function( referenceExpressionMap ) {
        var self = this,
            references = this.getReferences();
            
        referenceExpressionMap.forEach( function( key, value ) {
            if( self.parameterNames.indexOf( key ) < 0 ) {
                references.setIfAbsent( key, value );
            }                
        });
    };
    
    method.toString = function() {
        var codes = [],
            ret;
                
        for( var i = 0; i < this.statements.length; ++i ) {
            codes.push( this.statements[i].toString() );
        }
        
        return this._toString(
            this.name,
            id,
            this.parameterNames.join(", "),
            this.referenceAssignment( true ),
            codes.join("\n"),
            HtmlContextParser.context.HTML.name
        
        );
        
    };
    
    method._toString = MACRO.create(function(){
    
    
var $1 = (function() {
    function $2($3) {
        $4
        var ___html = '', ___context = null, ___ref, ___ref2;
$5
        return new ___r.Safe(___html, $6);
    }
    
    return $2;
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