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
            return new BooleanLiteral( right.toStringValue().indexOf( left.toStringValue() ) > -1 );
        }
        else if( right.constructor === ArrayLiteral ) {
            return new BooleanLiteral( right.staticContains(left) );
        }
        else if( right.constructor === MapLiteral ) {
            //TODO
        }
        else {
            return new BooleanLiteral( false );
        }
    };
    
    return InOperation;
})();
