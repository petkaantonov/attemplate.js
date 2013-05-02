var BooleanLiteral = TemplateExpressionParser.yy.BooleanLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = BooleanLiteral.prototype = Object.create(_super);
    
    method.constructor = BooleanLiteral;
    
    function BooleanLiteral( truefalse ) {
        _super.constructor.apply(this, arguments);
        this.value = truefalse === "true" ? true : truefalse === "false" ? false : !!truefalse;
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call boolean as a function");
    };
    
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
