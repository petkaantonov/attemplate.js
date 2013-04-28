var ArrayLiteral = (function() {
    var method = ArrayLiteral.prototype;
    
    function ArrayLiteral( elements ) {
        this.elements = elements;
    }
    
    method.toString = function() {
        return "[" + this.elements.toString() +"]";
        
    };
    
    return ArrayLiteral;
})();
