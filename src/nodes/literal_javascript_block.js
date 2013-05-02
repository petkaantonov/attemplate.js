var LiteralJavascriptBlock = TemplateExpressionParser.yy.LiteralJavascriptBlock = (function() {
    var _super = ProgramElement.prototype,
        method = LiteralJavascriptBlock.prototype = Object.create(_super);
    
    method.constructor = LiteralJavascriptBlock;
    
    function LiteralJavascriptBlock( code ) {
        _super.constructor.apply(this, arguments);
        this.code = code;
    }
    
    method.toString = function() {
        return this.code.toString();
    };
    
    return LiteralJavascriptBlock;
})();
