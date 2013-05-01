var ArrayLiteral = TemplateExpressionParser.yy.ArrayLiteral = (function() {
    var method = ArrayLiteral.prototype;
    
    function ArrayLiteral( elements ) {
        this.elements = elements;
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
    
    method.getStaticType = function() {
        return "string";
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
