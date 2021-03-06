var EqualityOperation = TemplateExpressionParser.yy.EqualityOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = EqualityOperation.prototype = Object.create(_super);
    
    method.constructor = EqualityOperation;
    
    function EqualityOperation() {
        _super.constructor.apply(this, arguments);
        if( this.operator === EqualityOperation.EQ ) {
            this.operator = EqualityOperation.EQ_STRICT;
        }
        else if( this.operator === EqualityOperation.NEQ ) {
            this.operator = EqualityOperation.NEQ_STRICT;
        }
    }
    
    method.isCommutative = function() {
        return true;
    };
    
    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue(),
            right = this.operandRight.unboxStaticValue(),
            result = left.staticallyEquals(right);

        if( this.operator === EqualityOperation.NEQ_STRICT ) {
            result = !result;
        }
        return result ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
    };
    
    EqualityOperation.EQ = "==";
    EqualityOperation.NEQ = "!=";
    EqualityOperation.EQ_STRICT = "===";
    EqualityOperation.NEQ_STRICT = "!==";
    
    return EqualityOperation;
})();
