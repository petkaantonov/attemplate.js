var PlusOperation = TemplateExpressionParser.yy.PlusOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = PlusOperation.prototype = Object.create(_super);
    
    method.constructor = PlusOperation;
    
    function PlusOperation() {
        _super.constructor.apply(this, arguments);
    }
    
    method.resolveStaticOperation = function() {
        var left,
            right,
            leftType = this.operandLeft.unboxStaticValue().getStaticCoercionType(),
            rightType = this.operandRight.unboxStaticValue().getStaticCoercionType();
            
        
        if( leftType === "number" &&
            rightType === "number" ) {
            left = this.operandLeft.unboxStaticValue().toNumberValue();
            right = this.operandRight.unboxStaticValue().toNumberValue();
            return new NumericLiteral( left + right );
        }
        else {
            left = this.operandLeft.unboxStaticValue().toStringValue(),
            right = this.operandRight.unboxStaticValue().toStringValue();
            return StringLiteral.fromRaw( left + right );
        }
    };
    
    return PlusOperation;
})();
