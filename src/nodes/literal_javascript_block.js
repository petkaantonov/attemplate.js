var LiteralJavascriptBlock = TemplateExpressionParser.yy.LiteralJavascriptBlock = (function() {
    var method = LiteralJavascriptBlock.prototype;
    
    function LiteralJavascriptBlock( code ) {
        this.code = code;
    }
    
    method.toString = function() {
        return this.code.toString();
    };
    
    return LiteralJavascriptBlock;
})();
