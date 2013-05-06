var BooleanLiteral = TemplateExpressionParser.yy.BooleanLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = BooleanLiteral.prototype = Object.create(_super);
    
    method.constructor = BooleanLiteral;
    
    function BooleanLiteral( truefalse ) {
        _super.constructor.apply(this, arguments);
        this.value = truefalse === "true" ? true : truefalse === "false" ? false : !!truefalse;
        this.setStatic();
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call boolean as a function");
    };
    
    method.equals = function( obj ) {
        return obj.constructor === BooleanLiteral && obj.value === this.value;
    };
        
    method.toStringQuoted = function() {
        return '"' +this.value+ '"';
    };
    
    method.toNumberValue = function() {
        return +this.value;
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.truthy = function() {
        return this.value;
    };
        
    method.toString = function() {
        return this.value ? "true" : "false";
    };
    
    return BooleanLiteral;
})();
