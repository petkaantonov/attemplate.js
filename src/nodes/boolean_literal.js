var BooleanLiteral = TemplateExpressionParser.yy.BooleanLiteral = (function() {
    var method = BooleanLiteral.prototype;
    
    function BooleanLiteral( truefalse ) {
        this.value = truefalse === "true" ? true : truefalse === "false" ? false : !!truefalse;
    }
    
    method.getStaticType = function() {
        return "boolean";
    };
    
    method.truthy = function() {
        return this.value;
    };
    
    method.isStatic = function() {
        return true;
    };
    
    method.toString = function() {
        return this.value ? "true" : "false";
    };
    
    return BooleanLiteral;
})();
