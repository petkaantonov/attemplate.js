var ArrayLiteral = TemplateExpressionParser.yy.ArrayLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = ArrayLiteral.prototype = Object.create(_super);
    
    method.constructor = ArrayLiteral;
    
    function ArrayLiteral( elements ) {
        _super.constructor.apply(this, arguments);
        this.elements = elements || [];
        this.init();
    }
    
    method.accessArrayStatically = function( index ) {
        if( !index.isStatic( true ) ) {
            throw new Error("Cannot do static array access using non-static index.");
        }
        var indexStr = index.toStringQuoted();
        
        if( indexStr === '"length"' ) {
            //Length of array literal
            //is always statically known
            return new NumericLiteral( this.getElementCount() );
        }
        
        var num = +(indexStr.slice(1, -1));
        
        //Integer index
        if( (num | 0) === num ) {
            var len = this.elements.length;
            //Would result in undefined no matter how dynamic contents
            if( num < 0 || num >= len ) {
                return NullLiteral.INSTANCE;
            }
            else {
                var elem = this.elements[num];
                if( elem.isStatic() ) {
                    return elem;
                }
                else { //Results in dynamic value if the integer index
                        //lands on a non-static element
                    return null;
                }
            }
        }
        else {
            //Accessing named array props other than length - results in undefined
            return NullLiteral.INSTANCE;
        }
    };
    
    method.init = function() {
        var elements = this.elements;
        for( var i = 0; i < elements.length; ++i ) {
            if( !elements[i].isStatic() ) {
                break;
            }
        }
        this.setStatic();
    };
    
    method.staticContains = function( obj ) {
        if( this.getElementCount() === 0 ) {
            return false;
        }
        for( var i = 0; i < this.elements.length; ++i ) {
            if( obj.equals( this.elements[i] ) ) {
                return true;
            }
        }
        
        return false;
    };
    
    method.toNumberValue = function() {
        _super.toNumberValue.call(this);
        
        if( this.getElementCount() === 0 ) {
            return 0;
        }
        else if( this.getElementCount() === 1 ) {
            return this.elements[0].toNumberValue();
        }
        return 0;
    };
    
    method.toStringValue = function() {
        _super.toStringValue.call( this );
        if( this.getElementCount() === 0 ) {
            return "";
        }
        var ret = [];
        for( var i = 0; i < this.elements.length; ++i ) {
            ret.push( this.elements[i].toStringValue() );
        }
        return ret.join(",");
    };
    
    method.memberAccessible = function() {
        return true;
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call array as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "string";
    };
    
    method.getElementCount = function() {
        return this.elements.length;
    };
    
    method.truthy = function() {
        return this.getElementCount() > 0;
    };
    
    
    method.toString = function() {
        if( !this.elements.length ) {
            return "[]";
        }
        return "[" + this.elements.toString() +"]";
        
    };
    
    return ArrayLiteral;
})();
