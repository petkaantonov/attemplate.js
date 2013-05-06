var RelationalOperation = TemplateExpressionParser.yy.RelationalOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = RelationalOperation.prototype = Object.create(_super);
    
    method.constructor = RelationalOperation;
    
    function RelationalOperation() {
        _super.constructor.apply(this, arguments);
    }
    

    // a < b < c --> a < b && b < c
    method.getLogicalAndOperationForMathNotation = function() {
        if( this.operandLeft instanceof RelationalOperation ) {
            var left = this.operandLeft,
                right = this.operandRight;
            
            return new LogicalOperation(
                left,
                new RelationalOperation( left.operandRight, right, this.operator),
                LogicalOperation.AND
            );
            
        }
        
        return null;
    };
    
    method.resolveStaticOperation = function() {
        var left,
            right,
            leftType = this.operandLeft.unboxStaticValue().getStaticCoercionType(),
            rightType = this.operandRight.unboxStaticValue().getStaticCoercionType();
            
        
        if( leftType === "string" &&
            rightType === "string" ) {
            left = this.operandLeft.unboxStaticValue().toStringValue(),
            right = this.operandRight.unboxStaticValue().toStringValue();
        }
        else {
            left = this.operandLeft.unboxStaticValue().toNumberValue();
            right = this.operandRight.unboxStaticValue().toNumberValue();
        }
            
        switch( this.operator ) {
            case RelationalOperation.GT: return new BooleanLiteral( left > right );
            case RelationalOperation.LT: return new BooleanLiteral( left < right );
            case RelationalOperation.GTE: return new BooleanLiteral( left >= right );
            case RelationalOperation.LTE: return new BooleanLiteral( left <= right );
            
            default: throw new Error("Illegal operator value for relational operation");
        }
    };
    
    
    RelationalOperation.GT = ">";
    RelationalOperation.LT = "<";
    RelationalOperation.GTE = ">=";
    RelationalOperation.LTE = "<=";
    
    
    return RelationalOperation;
})();
