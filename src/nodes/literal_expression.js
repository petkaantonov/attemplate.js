var LiteralExpression = TemplateExpressionParser.yy.LiteralExpression = (function() {
    var _super = OutputExpression.prototype,
        method = LiteralExpression.prototype = Object.create(_super);
    
    method.constructor = LiteralExpression;
    
    function LiteralExpression( literal ) {
        _super.constructor.apply(this, arguments);
        this.literal = literal;
    }
    
    method.concat = function( literal ) {
        return new LiteralExpression( this.literal + literal.literal );
    };

    method.getCode = function() {
                //Make it safe to embed in a javascript string literal
       var ret = this.literal.replace( rescapequote, "\\$1" ).replace( rlineterminator, lineterminatorReplacer );
       return "'" + ret +"'";
    };
        
    return LiteralExpression;
})();
