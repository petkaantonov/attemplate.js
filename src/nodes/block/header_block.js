//A block that has a header like @if( header ) { blockCode }
var HeaderBlock = TemplateExpressionParser.yy.HeaderBlock = (function() {
    var _super = BranchedBlock.prototype,
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
        return this._toString(
            this.getName(),
            (this.headerIsBooleanExpression() ? boolOp(this.header) : this.header ),
            _super.toString.call(this)
        );
        
        
    };
    
    method._toString = MACRO.create(function(){

$1 ($2)
{
$3
}

});


        
    return HeaderBlock;
})();


