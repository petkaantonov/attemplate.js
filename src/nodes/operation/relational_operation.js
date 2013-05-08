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
            left = this.operandLeft.unboxStaticValue().getStaticStringValue(),
            right = this.operandRight.unboxStaticValue().getStaticStringValue();
        }
        else {
            left = this.operandLeft.unboxStaticValue().getStaticNumberValue();
            right = this.operandRight.unboxStaticValue().getStaticNumberValue();
        }
            
        switch( this.operator ) {
            case ">": return left > right ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
            case "<": return left < right ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
            case ">=": return left >= right ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
            case "<=": return left <= right ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
            
            default:
                console.assert(false, "Illegal operator value for relational operation");
        }
    };
    
    
    RelationalOperation.GT = ">";
    RelationalOperation.LT = "<";
    RelationalOperation.GTE = ">=";
    RelationalOperation.LTE = "<=";
    
    
    return RelationalOperation;
})();
