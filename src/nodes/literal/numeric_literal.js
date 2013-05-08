var NumericLiteral = TemplateExpressionParser.yy.NumericLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = NumericLiteral.prototype = Object.create(_super);
    
    method.constructor = NumericLiteral;
    
    function NumericLiteral( num ) {
        _super.constructor.apply(this, arguments);
        this.num = +num;
        if( !isFinite(this.num)) {
            this.num = 0;
        }
        this.setStatic();
    }
    
    method.staticallyEquals = function( obj ) {
        return obj.constructor === NumericLiteral && obj.num === this.num;
    };
        
    method.toStringQuoted = function() {
        return '"' +this.num+ '"';
    };
    
    method.getStaticNumberValue = function() {
        return this.num;
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call number as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.isStaticallyTruthy = function() {
        return this.num !== 0;
    };
    
    method.flip = function() {
        this.num = -1 * this.num;
    };
    
    method.isNegative = function() {
        return this.num < 0;
    };
   
    method.toString = function() {
        return ("" + this.num);
    };
    
    return NumericLiteral;
})();
