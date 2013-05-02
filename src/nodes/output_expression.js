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
        
        //Merge consecutive literal expressions together first
        for( var i = 1; i < expressions.length; ++i ) {
            var prev = expressions[i-1];
            var cur = expressions[i];
            var newLiteral;
            if( prev instanceof LiteralExpression && cur instanceof LiteralExpression ) {
                newLiteral = prev.concat( cur );
                parent.insertChildBefore( prev, newLiteral );
                parent.removeChild( prev );
                parent.removeChild( cur );
                expressions.splice(i-1, 2, newLiteral);
            }            
        }
        
        //Merge dynamic and literal expressions together
        if( expressions.length > 1 ) {
            parent.removeChildrenAt(i-expressions.length, expressions.length);
            parent.insertChildAt( i-expressions.length,  new CombinedOutputExpression( expressions ) );
        }
    };
   
    method.getCode = function() {
       return "''";
    };
    
    method.toString = function() {
       return this.getIndentStr() + "___html += ("+this.getCode()+");\n"
    };
    
    return OutputExpression;
})();