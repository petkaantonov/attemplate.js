var MathOperation = TemplateExpressionParser.yy.MathOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = MathOperation.prototype = Object.create(_super);
    
    method.constructor = MathOperation;
    
    function MathOperation() {
        _super.constructor.apply(this, arguments);            
    }
    
    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue().getStaticNumberValue(),
            right = this.operandRight.unboxStaticValue().getStaticNumberValue();


        switch( this.operator ) {
            case "-": return new NumericLiteral( left - right );
            case "*": return new NumericLiteral( left * right );
            case "/": return new NumericLiteral( right === 0 ? 0 : left / right );
            case "%": return new NumericLiteral( left % right );

            default: 
                console.assert( false, "Illegal operator value for math operation operation");
        }
    };
    
    method.isCommutative = function() {
        return this.operator === MathOperation.MUL;
    };
    
    MathOperation.MINUS = "-";
    MathOperation.MUL = "*";
    MathOperation.DIV = "/";
    MathOperation.MOD = "%";
    
    return MathOperation;
})();
