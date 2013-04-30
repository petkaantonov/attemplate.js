var LiteralExpression = TemplateExpressionParser.yy.LiteralExpression = (function() {
    var method = LiteralExpression.prototype;
    
    function LiteralExpression( literal ) {
        this.literal = literal;
    }
    
    method.toString = function() {
                //Make it safe to embed in a javascript string literal
       var ret = this.literal.replace( rescapequote, "\\$1" ).replace( rlineterminator, lineterminatorReplacer );
       return "___html.push('" + ret +"');"
    };
    
    return LiteralExpression;
})();
