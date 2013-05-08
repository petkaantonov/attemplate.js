var UnaryOperation = TemplateExpressionParser.yy.UnaryOperation = (function() {
    var _super = Operation.prototype,
        method = UnaryOperation.prototype = Object.create(_super);
    
    method.constructor = UnaryOperation;
    
    function UnaryOperation( operand, operator ) {
        _super.constructor.apply(this, arguments);
        this.operand = operand;
        this.operator = operator;
        
        if( operand.isStatic() ) {
            this.setStatic();
        }
    }
    
    method.isBooleanOperation = function() {
        return this.operator = UnaryOperation.NOT;
    };

    method.resolveStaticOperation = function() {
        switch( this.operator ) {
            case UnaryOperation.PLUS: return new NumericLiteral( this.operand.unboxStaticValue().getStaticNumberValue() );
            case UnaryOperation.MINUS: return new NumericLiteral( this.operand.unboxStaticValue().getStaticNumberValue() );
            case UnaryOperation.NOT: return this.operand.unboxStaticValue().isStaticallyTruthy() ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
            
            default:
                console.assert( false, "Illegal operator value for unary operation" );
        }
    };
    
    method.toString = function() {
        if( this.isStatic() ) {
            return this.unboxStaticValue.toString();
        }
        var ret = this.operator.toString() + 
            (this.operator === UnaryOperation.NOT && !this.operand.isBooleanOperation() ? boolOp(this.operand) : this.operand.toString());
        return this.parens ? '(' + ret + ')' : ret;
    };
    
    UnaryOperation.PLUS = "+";
    UnaryOperation.MINUS = "-";
    UnaryOperation.NOT = "!";
    
    return UnaryOperation;
})();
