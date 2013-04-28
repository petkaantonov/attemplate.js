var TemplateExpression = (function() {
    var method = TemplateExpression.prototype;
    
    function TemplateExpression( expression, contextEscapeFn, escapeFn ) {
        this.expression = expression;
        this.contextEscapeFn = contextEscapeFn; //The escape function as inferred from html context for this expression
        this.escapeFn = escapeFn; //The custom escape function
    }
        
    method.toString = function() {
        var escapeFn = this.escapeFn ? this.escapeFn : this.contextEscapeFn;
        
        if( escapeFn.name ) {
            escapeFn = escapeFn.name;
        }
        
        if( typeof escapeFn !== "string" ) {
            //Dynamic attr
            var dynamicAttr = escapeFn.toString();
            return "___html.push(___safeString__((" + this.expression.toString()+"), null, "+dynamicAttr+"));";
        }
        
        return "___html.push(___safeString__((" + this.expression.toString()+"), '"+escapeFn+"'));";
    };
    
    return TemplateExpression;
})();