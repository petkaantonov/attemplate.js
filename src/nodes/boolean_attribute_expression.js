var BooleanAttributeExpression = TemplateExpressionParser.yy.BooleanAttributeExpression = (function() {
    var _super = ProgramElement.prototype,
        method = BooleanAttributeExpression.prototype = Object.create(_super);
    
    method.constructor = BooleanAttributeExpression;
    
    function BooleanAttributeExpression( name, quote ) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.quote = quote;
        this.expression = null;
    }
    
    method.push = function( value ) {
        if( (this.expression && !(value instanceof LiteralExpression))|| !(value instanceof TemplateExpression) ) {
            value.raiseError("Boolean attribute ('"+this.name+"') value can only be a single dynamic expression or static value.");
        }
        this.expression = value;
    };
        
    method.toString = function() {
        return this.getIndentStr() + 'if('+boolOp(this.expression.getExpression())+') {\n'+
                    this.getIndentStr()+'    ___html += ("'+this.name+'=\\"'+this.name+'\\"");\n'+
                    this.getIndentStr()+'}\n';
    };
    
    return BooleanAttributeExpression;
})();