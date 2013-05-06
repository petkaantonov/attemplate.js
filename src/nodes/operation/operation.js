var Operation = TemplateExpressionParser.yy.Operation = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = Operation.prototype = Object.create(_super);
    
    method.constructor = Operation;

    
    function Operation() {
        _super.constructor.apply(this, arguments);
        this.cachedStaticResult = null;
    }

    method.getStaticResolvedOp = function() {
        if( this.cachedStaticResult ) {
            return this.cachedStaticResult;
        }
        var ret = this.resolveStaticOperation();
        this.cachedStaticResult = ret;
        return ret;
        
    };
    
    method.checkValidForFunctionCall = function() {
        if( this.isStatic() ) {
            this.getStaticResolvedOp().unboxStaticValue().checkValidForFunctionCall();
        }
    };

    method.toStringQuoted = function() {
        return this.getStaticResolvedOp().toStringQuoted();
    };
    
    method.memberAccessible = function() {
        return this.getStaticResolvedOp().memberAccessible();
    };
    
    method.getStaticCoercionType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticCoercionType on non-static operation");
        }
        return this.getStaticResolvedOp().getStaticCoercionType();
        
    };
    
    method.unboxStaticValue = function() {
        return this.getStaticResolvedOp().unboxStaticValue();
    };
    
    method.resolveStaticOperation = function() {
        throw new TypeError("Implement in child class");
    };
    
    method.boolify = function() {
        return Operation.boolify( this );
    };
    
    method.toString = function() {
        throw new Error("Implement in child class");
    };
    
    Operation.boolify = function( expr ) {
        return '((___ref = '+expr+'), ___isArray(___ref) ? ___ref.length > 0 : ___ref)';
    };
    
    return Operation;
})();