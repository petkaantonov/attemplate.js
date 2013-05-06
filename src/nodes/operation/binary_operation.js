var BinaryOperation = TemplateExpressionParser.yy.BinaryOperation = (function() {
    var _super = Operation.prototype,
        method = BinaryOperation.prototype = Object.create(_super);
    
    method.constructor = BinaryOperation;
    
    function BinaryOperation( operandLeft, operandRight, operator ) {
        _super.constructor.apply(this, arguments);
        this.operandLeft = operandLeft;
        this.operandRight = operandRight;
        this.operator = operator;
        
        if( operandLeft.isStatic() &&
            operandRight.isStatic() ) {
            this.setStatic();
        }
    }
    
    method.toString = function() {
        if( this.isStatic() ) {
            return this.unboxStaticValue.toString();
        }
        var ret = this.operandLeft.toString() + this.operator.toString() + this.operandRight.toString();
        return this.parens ? '(' + ret + ')' : ret;
    };

    
    return BinaryOperation;
})();
