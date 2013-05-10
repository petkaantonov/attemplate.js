var NamedArgument = TemplateExpressionParser.yy.NamedArgument = (function() {
    var _super = Node.prototype,
        method = NamedArgument.prototype = Object.create(_super);
    
    method.constructor = NamedArgument;
        
    function NamedArgument( name, expr) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.expr = expr;
        this.checkValid();
    }
    
    method.children = function() {
        return [this.name, this.expr];
    };
    
    method.traverse = function( parent, depth, visitorFn, data ) {
        this.name.traverse( this, depth + 1, visitorFn, data );
        this.expr.traverse( this, depth + 1, visitorFn, data );
        visitorFn( this, parent, depth, data );
    };
    
    method.checkValid = function() {
        if( this.name.toString() === "__proto__" ) {
            this.raiseError("Cannot use __proto__ as a key");
        }
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        if( this.name === oldChild ) {
            this.name = newChild;
            return true;
        }
        else if( this.expr === oldChild ) {
            this.expr = newChild;
            return true;
        }
        return false;
    };
    
    method.checkValidForFunctionCall = function() {
        
    };
    
    method.unboxStaticValue = function() {
        return this.expr.unboxStaticValue();
    };
    
    method.getValue = function() {
        return this.expr;
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };
    
    method.getNameQuoted = function() {
        return this.name.toStringQuoted();
    };
   
    method.isStatic = function() {
        return this.expr.isStatic();
    };
        
    method.toString = function() {
        return this.name.toStringQuoted() + ": " + this.expr.toString();
    };
    
    return NamedArgument;
})();