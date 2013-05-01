var NumericLiteral = TemplateExpressionParser.yy.NumericLiteral = (function() {
    var method = NumericLiteral.prototype;
    
    function NumericLiteral( num ) {
        this.num = +num;
        if( !isFinite(this.num)) {
            this.num = 0;
        }
    }
    
    method.getStaticType = function() {
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
