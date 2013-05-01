var Assignment = TemplateExpressionParser.yy.Assignment = (function() {
    var _super = ProgramElement.prototype,
        method = Assignment.prototype = Object.create(_super);
    
    method.constructor = Assignment;

    function Assignment( ident, expr ) {
        _super.constructor.apply(this, arguments);
        this.ident = ident;
        this.expr = expr;
        this.ident.checkValid();
    }
    
    method.toString = function() {
        return "var " + this.ident + " = " + this.expr;
    };
    
    return Assignment;
})();
