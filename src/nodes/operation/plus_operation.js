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
            left = this.operandLeft.unboxStaticValue().getStaticNumberValue();
            right = this.operandRight.unboxStaticValue().getStaticNumberValue();
            return new NumericLiteral( left + right );
        }
        else {
            left = this.operandLeft.unboxStaticValue().getStaticStringValue(),
            right = this.operandRight.unboxStaticValue().getStaticStringValue();
            return StringLiteral.fromRaw( left + right );
        }
    };
    
    return PlusOperation;
})();
