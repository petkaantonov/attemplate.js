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
    
    method.isStatic = function() {
        return this.static;
    };
    
    method.equals = function( obj ) {
        return false;
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
    
    method.toStringValue = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call toNumberValue() on non-static element");
        }
        return this.toString();
    };
    
    method.toNumberValue = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call toNumberValue() on non-static element");
        }
        return 0;
    };
    
    method.checkValidForFunctionCall = function() {
    
    };
    
    method.truthy = function() {
        return false;
    };
    
    method.getStaticCoercionType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticCoercionType() on non-static element");
        }
        return "string";
    };
    
    method.unboxStaticValue = function() {
        return this;
    };
    
    
    
    return StaticallyResolveableElement;
})();
