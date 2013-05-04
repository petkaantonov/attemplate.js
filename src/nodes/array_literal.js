var ArrayLiteral = TemplateExpressionParser.yy.ArrayLiteral = (function() {
    var _super = ProgramElement.prototype,
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
            return new NumericLiteral( this.elements.length );
        }
        
        var num = +(indexStr.slice(1, -1));
        
        //Integer index
        if( (num | 0) === num ) {
            var len = this.elements.length;
            //Would result in undefined no matter how dynamic contents
            if( num < 0 || num >= len ) {
                return new NullLiteral();
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
            return new NullLiteral();
        }
    };
    
    method.init = function() {
        var elements = this.elements;
        for( var i = 0; i < elements.length; ++i ) {
            if( !elements[i].isStatic() ) {
                this.static = false;
                break;
            }
        }
        this.setStatic();
    };
    
    method.toStringQuoted = function() {
        return this.toString();
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
        return true;
    };
    
    method.isStatic = function() {
        return this.static;
    };
    
    method.setStatic = function() {
        this.static = true;
    };
    
    method.toString = function() {
        if( !this.elements.length ) {
            return "[]";
        }
        return "[" + this.elements.toString() +"]";
        
    };
    
    return ArrayLiteral;
})();
