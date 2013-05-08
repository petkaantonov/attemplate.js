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
            this.staticValue.checkValidForFunctionCall();
        }
    };
    
    method.getStaticCoercionType = function() {
        console.assert( this.isStatic(), "Cannot call getStaticCoercionType on non-static element.");
        return this.staticValue.getStaticCoercionType();
    };
    
    method.isStaticallyTruthy = function() {
        console.assert( this.isStatic(), "Cannot call isStaticallyTruthy on non-static element.");
        return this.staticValue.isStaticallyTruthy();
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
        /*todo need to check slowaccess here too */
        var ret = '(('+this.lhs.toString()+') || {})['+quotedMember+']';
        return this.parens ? '(' + ret + ')' : ret;
    };
        
    return CallExpression;
})();