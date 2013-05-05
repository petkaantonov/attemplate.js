var ElseBlock = TemplateExpressionParser.yy.ElseBlock = (function() {
    var _super = Block.prototype,
        method = ElseBlock.prototype = Object.create(_super);
    
    method.constructor = ElseBlock;
    
    function ElseBlock() {
        _super.constructor.apply(this, arguments);
    }
    
    method.isBranched = function() {
        return true;
    };
    
    method.toString = function() {
        return this.getIndentStr() + "else {\n" + _super.toString.call( this ) + "\n"+this.getIndentStr()+"}\n";
    };
    
    return ElseBlock;
})();