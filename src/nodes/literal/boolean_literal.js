var BooleanLiteral = TemplateExpressionParser.yy.BooleanLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = BooleanLiteral.prototype = Object.create(_super);
    
    method.constructor = BooleanLiteral;
    
    function BooleanLiteral( value ) {
        _super.constructor.apply(this, arguments);
        console.assert( value === "true" || value === "false", "invalid argument to boolean literal" ) 
        this.value = value === "true" && true || false;
        this.setStatic();
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call boolean as a function");
    };
    
    method.staticallyEquals = function( obj ) {
        return obj.constructor === BooleanLiteral && obj.value === this.value;
    };
        
    method.toStringQuoted = function() {
        return '"' +this.value+ '"';
    };
    
    method.getStaticNumberValue = function() {
        return +this.value;
    };
    
    method.getStaticCoercionType = function() {
        return "number";
    };
    
    method.isStaticallyTruthy = function() {
        return this.value;
    };
        
    method.toString = function() {
        return this.value ? "true" : "false";
    };
    
    BooleanLiteral.TRUE = new BooleanLiteral( "true" );
    BooleanLiteral.FALSE = new BooleanLiteral( "false" );
    
    return BooleanLiteral;
})();
