var CallExpression = TemplateExpressionParser.yy.CallExpression = (function() {
    var _super = Node.prototype,
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
    
    method.traverse = function( parent, depth, visitorFn ) {
        this.lhs.traverse( this, depth + 1, visitorFn );
        this.rhs.traverse( this, depth + 1, visitorFn );
        visitorFn( this, parent, depth );
    };
    
    method.children = function() {
        return [this.lhs, this.rhs];
    };
    
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