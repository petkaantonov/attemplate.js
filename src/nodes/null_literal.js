var NullLiteral = TemplateExpressionParser.yy.NullLiteral = (function() {
    var method = NullLiteral.prototype;
    
    function NullLiteral() {
      
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
