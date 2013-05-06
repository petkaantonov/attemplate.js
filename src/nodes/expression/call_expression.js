var CallExpression = TemplateExpressionParser.yy.CallExpression = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = CallExpression.prototype = Object.create(_super);
    
    method.constructor = CallExpression;
    
    function CallExpression( lhs, rhs ) {
        _super.constructor.apply(this, arguments);
        this.lhs = lhs;
        this.rhs = rhs;
        this.staticValue = null;
        if( this.isStatic() ) {
            this.staticValue = this.lhs.accessMapStatically(this.rhs);
        }
    }
    
    method.checkValidForFunctionCall = function() {
        if( this.staticValue ) {
            return this.staticValue.checkValidForFunctionCall();
        }
        return true;
    };
    
    method.getStaticCoercionType = function() {
        if( this.staticValue ) {
            return this.staticValue.getStaticCoercionType();
        }
        else {
            throw new Error("Cannot call getStaticCoercionType on non-static call expression.");
        }
    };
    
    method.truthy = function() {
        return this.staticValue.truthy();
    };
    
    method.isStatic = function() {
        return !!this.staticValue || (this.lhs.constructor === MapLiteral && this.rhs.isStatic( true ) && this.lhs.isStaticMapAccess(this.rhs));
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };

    method.toString = function() {
        if( this.staticValue ) {
            return this.staticValue.toString();
        }
        var quotedMember = this.rhs.toStringQuoted();
        if( rinvalidprop.test(quotedMember) ) {
            this.rhs.raiseError("Illegal property access: "+quotedMember);
        }
        var ret = '(('+this.lhs.toString()+') || {})['+quotedMember+']';
        return this.parens ? '(' + ret + ')' : ret;
    };
        
    return CallExpression;
})();