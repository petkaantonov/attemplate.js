var NullLiteral = TemplateExpressionParser.yy.NullLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = NullLiteral.prototype = Object.create(_super);
    
    method.constructor = NullLiteral;
    
    function NullLiteral() {
        _super.constructor.apply(this, arguments);
        this.parens = false;
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call null as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.truthy = function() {
        return false;
    };
    
    method.memberAccessible = function() {
        return false;
    };
    
    method.isStatic = function() {
        return true;
    };

    method.toStringQuoted = function() {
        return '"null"';
    };
    
    method.toString = function() {
        return "null";
    };
    
    NullLiteral.INSTANCE = new NullLiteral();
    
    return NullLiteral;
})();
