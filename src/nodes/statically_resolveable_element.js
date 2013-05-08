var StaticallyResolveableElement = TemplateExpressionParser.yy.StaticallyResolveableElement = (function() {
    var _super = ProgramElement.prototype,
        method = StaticallyResolveableElement.prototype = Object.create(_super);
    
    method.constructor = StaticallyResolveableElement;
    
    function StaticallyResolveableElement() {
        _super.constructor.apply(this, arguments);
        this.static = false;
        this.parens = false;
    }
    
    method.isBooleanOperation = function() {
        return false;
    };

    method.getStaticStringValue = function() {
        console.assert( this.isStatic(), "Cannot call getStaticStringValue() on non-static element");
        return this.toString();
    };
    
    method.getStaticNumberValue = function() {
        console.assert( this.isStatic(), "Cannot call getStaticNumberValue() on non-static element");
        return 0;
    };

    method.isStaticallyTruthy = function() {
        console.assert( this.isStatic(), "Cannot call isStaticallyTruthy on non-static element");
        return false;
    };
    
    method.getStaticCoercionType = function() {
        console.assert( this.isStatic(), "Cannot call getStaticCoercionType() on non-static element");
        return "string";
    };
   
    method.staticallyEquals = function( obj ) {
        console.assert( this.isStatic(), "Cannot call staticallyEquals() on non-static element");
        return false;
    };    
    
    method.isStatic = function() {
        return this.static;
    };
    
    method.unboxStaticValue = function() {
        return this;
    };
    
    method.setParens = function() {
        this.parens = true;
        return this;
    };
    
    method.setStatic = function() {
        this.static = true;
        this.parens = false;
        return this;
    };
    
    method.memberAccessible = function() {
        return false;
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };
    

    
    method.checkValidForFunctionCall = function() {
    
    };
    

    
    
    return StaticallyResolveableElement;
})();
