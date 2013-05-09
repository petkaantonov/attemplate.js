var LogicalOperation = TemplateExpressionParser.yy.LogicalOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = LogicalOperation.prototype = Object.create(_super);
    
    method.constructor = LogicalOperation;
    
    function LogicalOperation() {
        _super.constructor.apply(this, arguments);
    }
    
    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue(),
            right = this.operandRight.unboxStaticValue();

        switch( this.operator ) {
            case "&&": return !left.isStaticallyTruthy() ? left : right;
            case "||": return left.isStaticallyTruthy() ? left : right;

            default:
                console.assert( false, "Illegal operator value for relational operation");
        }
    };
    

    
    method.boolify = function() {
        var ret = Operation.boolify( this.operandLeft ) + " " + this.operator + " "+ Operation.boolify( this.operandRight );
        return this.parens ? '(' + ret + ')' : ret;
    };
    
    LogicalOperation.AND = "&&";
    LogicalOperation.OR = "||";
    
    return LogicalOperation;
})();
