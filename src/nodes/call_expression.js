var CallExpression = TemplateExpressionParser.yy.CallExpression = (function() {
    var _super = ProgramElement.prototype,
        method = CallExpression.prototype = Object.create(_super);
    
    method.constructor = CallExpression;
    
    function CallExpression( fn, mem ) {
        _super.constructor.apply(this, arguments);
        this.fn = fn;
        this.member = mem;
        this.staticValue = null;
        if( this.isStatic() ) {
            this.staticValue = this.fn.accessMapStatically(this.member);
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
        return !!this.staticValue || (this.fn.isMap && this.member.isStatic( true ) && this.fn.isStaticMapAccess(this.member));
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };

    method.toString = function() {
        if( this.staticValue ) {
            return this.staticValue.toString();
        }
        var quotedMember = this.member.toStringQuoted();
        if( rinvalidprop.test(quotedMember) ) {
            this.member.raiseError("Illegal property access: "+quotedMember);
        }
        var ret = '(('+this.fn.toString()+') || {})['+quotedMember+']';
        return this.parens ? '(' + ret + ')' : ret;
    };
        
    return CallExpression;
})();