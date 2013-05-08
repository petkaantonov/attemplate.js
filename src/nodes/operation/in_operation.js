var InOperation = TemplateExpressionParser.yy.InOperation = (function() {
    var _super = BinaryOperation.prototype,
        method = InOperation.prototype = Object.create(_super);
    
    method.constructor = InOperation;
    
    function InOperation() {
        _super.constructor.apply(this, arguments);
    }
    
    method.isBooleanOperation = function() {
        return true;
    };

    method.resolveStaticOperation = function() {
        var left = this.operandLeft.unboxStaticValue(),
            right = this.operandRight.unboxStaticValue();
            
            
        if( left.constructor === StringLiteral &&
            right.constructor === StringLiteral ) {
            return right.getStaticStringValue().indexOf( left.getStaticStringValue() ) > -1 ? 
                BooleanLiteral.TRUE : BooleanLiteral.FALSE;
        }
        else if( right.constructor === ArrayLiteral ) {
            return right.staticContains(left) ? BooleanLiteral.TRUE : BooleanLiteral.FALSE;
        }
        else if( right.constructor === MapLiteral ) {
            //TODO
        }
        else {
            return BooleanLiteral.FALSE;
        }
    };
    
    method.toString = function() {
        return "___r.inOp( "+this.operandRight+", "+this.operandLeft+")"
    };
    
    return InOperation;
})();
