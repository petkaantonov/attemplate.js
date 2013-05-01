var Assignment = TemplateExpressionParser.yy.Assignment = (function() {
    var _super = ProgramElement.prototype,
        method = Assignment.prototype = Object.create(_super);
    
    method.constructor = Assignment;
    //Todo check identifier validity
    function Assignment( ident, expr ) {
        _super.constructor.apply(this, arguments);
        this.ident = ident;
        this.expr = expr;
    }
    
    method.toString = function() {
        return "var " + this.ident + " = " + this.expr;
    };
    
    return Assignment;
})();
