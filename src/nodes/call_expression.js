var CallExpression = TemplateExpressionParser.yy.CallExpression = (function() {
    var _super = ProgramElement.prototype,
        method = CallExpression.prototype = Object.create(_super);
    
    method.constructor = CallExpression;
    
    function CallExpression( fn, mem ) {
        _super.constructor.apply(this, arguments);
        this.fn = fn;
        this.member = mem;
    }
    
    method.isStatic = function() {
        return false;
    };

    method.toString = function() {
        var ret = '(('+this.fn.toString()+') || {})['+this.member.toString()+']';
        return this.parens ? '(' + ret + ')' : ret;
    };
        
    return CallExpression;
})();