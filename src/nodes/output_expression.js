var OutputExpression = TemplateExpressionParser.yy.OutputExpression = (function() {
    var _super = ProgramElement.prototype,
        method = OutputExpression.prototype = Object.create(_super);
    
    method.constructor = OutputExpression;
    
    function OutputExpression() {
        _super.constructor.apply(this, arguments);
        this.runtimeContext = false;
    }
    
    method.setContextDeterminedAtRuntime = function() {
        this.runtimeContext = true;
        return this;
    };
    
    method.isContextDeterminedAtRuntime = function() {
        return this.runtimeContext;
    };

    //Optimize consecutive output expressions into a concatenation statement
    method.performAnalysis = function( parent ) {
        var insertionPoint = this,
            statements = parent.getStatements(),
            
            expressions = [this];
            
        for( var i = parent.indexOfChild(this) + 1; i < statements.length; ++i ) {
            var statement = statements[i];
            
            if( !(statement instanceof OutputExpression ) ) {
                break;    
            }
            expressions.push( statement );
        }
        
        //Merge consecutive literal expressions together first
        //TODO test hot spot
        for( var i = 1; i < expressions.length; ++i ) {
            var prev = expressions[i-1];
            var cur = expressions[i];
            var newLiteral;
            if( prev instanceof LiteralExpression && cur instanceof LiteralExpression ) {
                newLiteral = prev.concat( cur );
                parent.replaceChild( prev, newLiteral );
                parent.removeChild( cur );
                expressions.splice(i-1, 2, newLiteral);
            }            
        }
        
        //TODO test hot spot
        //Merge dynamic and literal expressions together
        if( expressions.length > 1 ) {
            parent.removeChildrenAt(expressions[1], expressions.length - 1);
            parent.replaceChild( this, new CombinedOutputExpression( expressions ) );
        }
    };
   
    method.getCode = function() {
       return "''";
    };
    
    method.toString = function() {
        return "\n" + this._toString(this.getCode()) + "\n";
    };
    
    method._toString = MACRO.create(function(){
___html += $1;
});
    
    return OutputExpression;
})();