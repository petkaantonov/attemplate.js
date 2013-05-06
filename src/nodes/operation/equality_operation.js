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
    
    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue(),
            right = this.operandRight.unboxStaticValue(),
            result = left.equals(right);

        if( this.operator === EqualityOperation.NEQ_STRICT ) {
            result = !result;
        }
        return new BooleanLiteral( result );
    };
    
    EqualityOperation.EQ = "==";
    EqualityOperation.NEQ = "!=";
    EqualityOperation.EQ_STRICT = "===";
    EqualityOperation.NEQ_STRICT = "!==";
    
    return EqualityOperation;
})();
