var ArrayLiteral = TemplateExpressionParser.yy.ArrayLiteral = (function() {
    var _super = Node.prototype,
        method = ArrayLiteral.prototype = Object.create(_super);
    
    method.constructor = ArrayLiteral;
    
    function ArrayLiteral( elements ) {
        _super.constructor.apply(this, arguments);
        this.elements = elements || [];
        this.init();
    }
    
    method.traverse = function( parent, depth, visitorFn, data ) {
        var len = this.elements.length;
        for( var i = 0; i < len; ++i ) {
            this.elements[i].traverse( this, depth+1, visitorFn, data );
        }
        visitorFn( this, parent, depth );
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        var elements = this.elements,
            len = elements.length;

        for( var i = 0; i < len; ++i ) {
            if( elements[i] === oldChild ) {
                elements[i] = newChild;
                return true;
            }
        }
        
        return false;
    };
    
    method.children = function() {
        return this.elements.slice(0);
    };
    
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
            if( obj.staticallyEquals( this.elements[i] ) ) {
                return true;
            }
        }
        
        return false;
    };
    
    method.getStaticNumberValue = function() {
        _super.getStaticNumberValue.call(this);
        
        if( this.getElementCount() === 0 ) {
            return 0;
        }
        else if( this.getElementCount() === 1 ) {
            return this.elements[0].getStaticNumberValue();
        }
        return 0;
    };
    
    method.getStaticStringValue = function() {
        _super.getStaticStringValue.call( this );
        if( this.getElementCount() === 0 ) {
            return "";
        }
        var ret = [];
        for( var i = 0; i < this.elements.length; ++i ) {
            ret.push( this.elements[i].getStaticStringValue() );
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
    
    method.isStaticallyTruthy = function() {
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
