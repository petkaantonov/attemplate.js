var NamedArgument = TemplateExpressionParser.yy.NamedArgument = (function() {
    var _super = ProgramElement.prototype,
        method = NamedArgument.prototype = Object.create(_super);
    
    method.constructor = NamedArgument;
        
    function NamedArgument( name, expr) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.expr = expr;        
    }
    
    method.checkValidForFunctionCall = function() {
        
    };
    
    method.getValue = function() {
        return this.expr;
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };
    
    method.getNameQuoted = function() {
        return this.name.toStringQuoted();
    };
   
    method.isStatic = function() {
        return this.expr.isStatic && this.expr.isStatic();
    };
        
    method.toString = function() {
        return this.name.toStringQuoted() + ": " + this.expr.toString();
    };
    
    return NamedArgument;
})();