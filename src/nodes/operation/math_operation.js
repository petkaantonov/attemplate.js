var MathOperation = TemplateExpressionParser.yy.MathOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = MathOperation.prototype = Object.create(_super);
    
    method.constructor = MathOperation;
    
    function MathOperation() {
        _super.constructor.apply(this, arguments);
    }
    
    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue().toNumberValue(),
            right =  = this.operandRight.unboxStaticValue().toNumberValue();


        switch( this.operator ) {
            case MathOperation.MINUS: return new NumericLiteral( left - right );
            case MathOperation.MUL: return new NumericLiteral( left * right );
            case MathOperation.DIV: return new NumericLiteral( right === 0 ? 0 : left / right );
            case MathOperation.MOD: return new NumericLiteral( left % right );

            default: throw new Error("Illegal operator value for math operation operation");
        }
    };
    
    MathOperation.MINUS = "-";
    MathOperation.MUL = "*";
    MathOperation.DIV = "/";
    MathOperation.MOD = "%";
    
    return MathOperation;
})();
