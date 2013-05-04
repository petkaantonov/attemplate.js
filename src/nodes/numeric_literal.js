var NumericLiteral = TemplateExpressionParser.yy.NumericLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = NumericLiteral.prototype = Object.create(_super);
    
    method.constructor = NumericLiteral;
    
    function NumericLiteral( num ) {
        _super.constructor.apply(this, arguments);
        this.num = +num;
        if( !isFinite(this.num)) {
            this.num = 0;
        }
    }
    
    method.memberAccessible = function() {
        return false;
    };
    
    method.toStringQuoted = function() {
        return '"' +this.num+ '"';
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call number as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.truthy = function() {
        return this.num !== 0;
    };
    
    method.flip = function() {
        this.num = -1 * this.num;
    };
    
    method.isNegative = function() {
        return this.num < 0;
    };
    
    method.isStatic = function() {
        return true;
    };
    
    method.toString = function() {
        return ("" + this.num);
    };
    
    return NumericLiteral;
})();
