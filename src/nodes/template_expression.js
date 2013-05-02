var TemplateExpression = TemplateExpressionParser.yy.TemplateExpression = (function() {
    var _super = OutputExpression.prototype,
        method = TemplateExpression.prototype = Object.create(_super);
    
    method.constructor = TemplateExpression;
    
    function TemplateExpression( expression, contextEscapeFn, escapeFn ) {
        _super.constructor.apply(this, arguments);
        this.expression = expression;
        this.contextEscapeFn = contextEscapeFn; //The escape function as inferred from html context for this expression
        this.escapeFn = escapeFn; //The custom escape function
    }

    method.getExpression = function() {
        return this.expression;
    };
    
    method.performAnalysis = function( parent ) {
        _super.performAnalysis.call( this, parent );
    };
 
    method.getCode = function() {
        var escapeFn = this.escapeFn ? this.escapeFn : this.contextEscapeFn;

        if( escapeFn.name ) {
            escapeFn = escapeFn.name;
        }

        if( typeof escapeFn === "object" ) {
            //Dynamic attr
            var dynamicAttr = escapeFn.toString();
            return "___safeString__(" + this.expression.toString()+", null, "+dynamicAttr+")";
        }
                
        return "___safeString__(" + this.expression.toString()+", "+escapeFn+")";
    };
        
    method.toString = function() {

        return this.getIndentStr() + "___html += ("+this.getCode()+");\n";
    };
    
    return TemplateExpression;
})();