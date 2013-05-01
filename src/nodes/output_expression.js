var OutputExpression = TemplateExpressionParser.yy.OutputExpression = (function() {
    var _super = ProgramElement.prototype,
        method = OutputExpression.prototype = Object.create(_super);
    
    method.constructor = OutputExpression;
    
    function OutputExpression() {
        _super.constructor.apply(this, arguments);
    }

    //Optimize consecutive output expressions into a concatenation statement
    method.performAnalysis = function( parent ) {
        var insertionPoint = this,
            statements = parent.getStatements(),
            expressions = [];
            
        for( var i = parent.indexOfChild(this); i < statements.length; ++i ) {
            var statement = statements[i];
            
            if( !(statement instanceof OutputExpression ) ) {
                break;    
            }
            expressions.push( statement );
        }
        
        if( expressions.length > 1 ) {
            parent.removeChildrenAt(i-expressions.length, expressions.length);
            parent.insertChildAt( i-expressions.length,  new CombinedOutputExpression( expressions ) );
        }
    };
   
    method.getCode = function() {
       return "''";
    };
    
    method.toString = function() {
       return "___html += ("+this.getCode()+");"
    };
    
    return OutputExpression;
})();