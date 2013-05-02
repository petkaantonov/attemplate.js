var CombinedOutputExpression = TemplateExpressionParser.yy.CombinedOutputExpression = (function() {
    var _super = OutputExpression.prototype,
        method = CombinedOutputExpression.prototype = Object.create(_super);
    
    method.constructor = CombinedOutputExpression;
    
    function CombinedOutputExpression( outputExpressions ) {
        _super.constructor.apply(this, arguments);
        this.outputExpressions = outputExpressions;
    }
    
    method.performAnalysis = function() {
        //Noop override
    };
    
    method.toString = function() {
        var ret = [],
            expr = this.outputExpressions;
            
        for( var i = 0; i < expr.length; ++i ) {
            ret.push( expr[i].getCode() );
        }

        return "\n" + this._toString( ret.join(" +\n           " + this.getIndentStr())) + "\n";
    };

    method._toString = MACRO.create(function(){
___html += $1;
});
    
    return CombinedOutputExpression;
})();
