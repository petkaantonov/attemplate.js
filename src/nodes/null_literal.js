var NullLiteral = TemplateExpressionParser.yy.NullLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = NullLiteral.prototype = Object.create(_super);
    
    method.constructor = NullLiteral;
    
    function NullLiteral() {
        _super.constructor.apply(this, arguments);
    }
    
    method.getStaticType = function() {
        return "null";
    };
    
    method.truthy = function() {
        return false;
    };
    
    method.isStatic = function() {
        return true;
    };
    
    method.toString = function() {
        return "null";
    };
    
    return NullLiteral;
})();
