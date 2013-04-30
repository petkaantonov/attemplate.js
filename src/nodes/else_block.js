var ElseBlock = TemplateExpressionParser.yy.ElseBlock = (function() {
    var _super = Block.prototype,
        method = ElseBlock.prototype = Object.create(_super);
    
    method.constructor = ElseBlock;
    
    function ElseBlock() {
        _super.constructor.apply(this, arguments);
    }
    
    method.toString = function() {
        return "else { " + _super.toString.call( this ) + " } ";
    };
    
    return ElseBlock;
})();
