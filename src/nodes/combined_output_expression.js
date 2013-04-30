var CombinedOutputExpression = TemplateExpressionParser.yy.CombinedOutputExpression = (function() {
    var _super = OutputExpression.prototype,
        method = CombinedOutputExpression.prototype = Object.create(_super);
    
    method.constructor = CombinedOutputExpression;
    
    function CombinedOutputExpression( outputExpressions ) {
        _super.constructor.apply(this, arguments);
        this.outputExpressions = outputExpressions;
    }
    
    method.performAnalysis = function() {
    
    };
    
    method.toString = function() {
        var ret = [],
            expr = this.outputExpressions;
            
        for( var i = 0; i < expr.length; ++i ) {
            ret.push( expr[i].getCode() );
        }
        
        return "___html.push("+ret.join(" + ") +");";
    };
    
    return CombinedOutputExpression;
})();
