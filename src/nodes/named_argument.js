var NamedArgument = TemplateExpressionParser.yy.NamedArgument = (function() {
    var _super = ProgramElement.prototype,
        method = NamedArgument.prototype = Object.create(_super);
    
    method.constructor = NamedArgument;
        
    function NamedArgument( name, expr) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.expr = expr;
    }
    
    method.toString = function() {
        return ( typeof this.name === "string" ? 
            '"' + this.name + '"' : 
            this.name.toString() ) + ": " + this.expr.toString();
    };
    
    return NamedArgument;
})();