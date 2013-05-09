var NullLiteral = TemplateExpressionParser.yy.NullLiteral = (function() {
    var _super = TerminalNode.prototype,
        method = NullLiteral.prototype = Object.create(_super);
    
    method.constructor = NullLiteral;
    
    function NullLiteral() {
        _super.constructor.apply(this, arguments);
        this.setStatic();
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call null as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.staticallyEquals = function( obj ) {
        return obj.constructor === NullLiteral;
    };
    
    method.getStaticNumberValue = function() {
        return 0;
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
