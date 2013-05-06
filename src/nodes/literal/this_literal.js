var ThisLiteral = TemplateExpressionParser.yy.ThisLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = ThisLiteral.prototype = Object.create(_super);
    
    method.constructor = ThisLiteral;
    
    function ThisLiteral() {
        _super.constructor.apply(this, arguments);
    }

    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call this as a function");
    };
       
    method.toString = function() {
        return "this";
    };
    
    method.toStringQuoted = function() {
        return '"this"';
    };

    ThisLiteral.INSTANCE = new ThisLiteral();

    return ThisLiteral;
})();
