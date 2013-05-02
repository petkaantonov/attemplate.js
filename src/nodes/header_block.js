//A block that has a header like @if( header ) { blockCode }
var HeaderBlock = TemplateExpressionParser.yy.HeaderBlock = (function() {
    var _super = Block.prototype,
        method = HeaderBlock.prototype = Object.create(_super);
    
    method.constructor = HeaderBlock;
    
    function HeaderBlock( header ) {
        _super.constructor.apply(this, arguments);
        this.header = header;
    }
    
    method.headerIsBooleanExpression = function() {
        return false;
    };
    
    method.toString = function() {
        return this.getIndentStr() + this.getName() + " ( " + 
            (this.headerIsBooleanExpression() ? boolOp(this.header) : this.header ) + 
        " ) {\n" + _super.toString.call(this) + "\n"+this.getIndentStr()+"}\n";
    };
        
    return HeaderBlock;
})();