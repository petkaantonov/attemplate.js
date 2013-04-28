var BooleanAttributeExpression = (function() {
    var method = BooleanAttributeExpression.prototype;
    
    function BooleanAttributeExpression( name, quote ) {
        this.name = name;
        this.quote = quote;
        this.expression = null;
    }
    
    method.push = function( value ) {
        if( (this.expression && !(value instanceof LiteralExpression))|| !(value instanceof TemplateExpression) ) {
            doError("Invalid expression for boolean attribute");
        }
        this.expression = value;
    };
        
    method.toString = function() {
        return 'if(___boolOp('+this.expression.getExpression()+') ) {___html.push("'+this.name+'=\\"'+this.name+'\\"")}';
    };
    
    return BooleanAttributeExpression;
})();
