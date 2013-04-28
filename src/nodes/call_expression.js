var CallExpression = (function() {
    var method = CallExpression.prototype;
    
    function CallExpression( fn, mem ) {
        this.fn = fn;
        this.member = mem;
    }

    method.toString = function() {
        return '('+this.fn.toString()+' || {})['+this.member.toString()+']';
    };
        
    return CallExpression;
})();