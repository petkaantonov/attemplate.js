var TemplateExpression = (function() {
    var method = TemplateExpression.prototype;
    
    function TemplateExpression( expression, contextEscapeFn, escapeFn ) {
        this.expression = expression;
        this.contextEscapeFn = contextEscapeFn; //The escape function as inferred from html context for this expression
        this.escapeFn = escapeFn; //The custom escape function
    }
    
    method.toString = function() {
        var escapeFn = this.escapeFn ? this.escapeFn : this.contextEscapeFn;
        return "___html.push(___safeString__((" + this.expression.toString()+"), '"+escapeFn+"'));";
    };
    
    return TemplateExpression;
})();