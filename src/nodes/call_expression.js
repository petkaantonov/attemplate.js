var CallExpression = (function() {
    var method = CallExpression.prototype;
    
    function CallExpression( fn, mem ) {
        this.fn = fn;
        this.member = mem;
    }

    method.toString = function() {
        var ret = '(('+this.fn.toString()+') || {})['+this.member.toString()+']';
        return this.parens ? '(' + ret + ')' : ret;
    };
        
    return CallExpression;
})();