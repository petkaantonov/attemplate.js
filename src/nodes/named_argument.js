var NamedArgument = TemplateExpressionParser.yy.NamedArgument = (function() {
    var method = NamedArgument.prototype;
    
    function NamedArgument( name, expr) {
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