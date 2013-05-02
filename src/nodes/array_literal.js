var ArrayLiteral = TemplateExpressionParser.yy.ArrayLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = ArrayLiteral.prototype = Object.create(_super);
    
    method.constructor = ArrayLiteral;
    
    function ArrayLiteral( elements ) {
        _super.constructor.apply(this, arguments);
        this.elements = elements || [];
        this.static = true;
        this.init();
    }
    
    method.init = function() {
        var elements = this.elements;
        for( var i = 0; i < elements.length; ++i ) {
            if( !elements[i].isStatic() ) {
                this.static = false;
            }
        }
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call array as a function");
    };
    
    method.getStaticType = function() {
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
        return "[" + this.elements.toString() +"]";
        
    };
    
    return ArrayLiteral;
})();
