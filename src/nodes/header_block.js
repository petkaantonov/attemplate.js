//A block that has a header like @if( header ) { blockCode }
var HeaderBlock = (function() {
    var _super = Block.prototype,
        method = HeaderBlock.prototype = Object.create(_super);
    
    method.constructor = HeaderBlock;
    
    function HeaderBlock( header ) {
        _super.constructor.apply(this, arguments);
        this.header = header;
    }
    
    method.toString = function() {
        return this.getName() + " ( " + this.header + " )  { " + _super.toString.call(this) + "}";
    };
        
    return HeaderBlock;
})();