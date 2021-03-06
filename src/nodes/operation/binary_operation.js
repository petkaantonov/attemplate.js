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
    
    method.swapOperands = function() {
        console.assert( this.isCommutative(), "swapOperands can only be called on commutative operations");
    
        var tmp = this.operandLeft;
        this.operandLeft = this.operandRight;
        this.operandRight = tmp;
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        if( oldChild === this.operandLeft ) {
            this.operandLeft = newChild;
            return true;
        }
        else if( oldChild === this.operandRight ) {
            this.operandRight = newChild;
            return true;
        }
        else {
            return false;
        }
    };
    
    method.isCommutative = function() {
        return false;
    };
    
    method.children = function() {
        return [this.operandLeft, this.operandRight];
    };
    
    method.traverse = function( parent, depth, visitorFn, data ) {
        this.operandLeft.traverse( this, depth + 1, visitorFn, data );
        this.operandRight.traverse( this, depth + 1, visitorFn, data );
        visitorFn( this, parent, depth, data );
    };
        
    method.toString = function() {
        if( this.isStatic() ) {
            return this.unboxStaticValue().toString();
        }
        var ret = this.operandLeft.toString() + this.operator.toString() + this.operandRight.toString();
        return this.parens ? '(' + ret + ')' : ret;
    };

    
    return BinaryOperation;
})();
