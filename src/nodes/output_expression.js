var OutputExpression = TemplateExpressionParser.yy.OutputExpression = (function() {
    var method = OutputExpression.prototype;
    
    function OutputExpression() {
      
    }

    //Optimize consecutive output expressions into a concatenation statement
    method.performAnalysis = function( parent ) {
        var insertionPoint = this,
            statements = parent.getStatements(),
            insertAt,
            removeAt,
            expressions = [this];
            
        for( var i = insertAt = removeAt = parent.indexOfChild(this) + 1; i < statements.length; ++i ) {
            var statement = statements[i];
            
            if( !(statement instanceof OutputExpression ) ) {
                break;    
            }
            expressions.push( statement );
        }
        
        if( expressions.length > 1 ) {
            var newChild = new CombinedOutputExpression( expressions );
             
            parent.removeChildrenAt(removeAt-1, expressions.length);
        }
    };
   
    method.getCode = function() {
       return "''";
    };
    
    method.toString = function() {
       return "___html.push("+this.getCode()+");"
    };
    
    return OutputExpression;
})();
