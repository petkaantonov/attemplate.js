var IfBlock = (function() {
    var _super = HeaderBlock.prototype,
        method = IfBlock.prototype = Object.create(_super);
    
    method.constructor = IfBlock;
    
    function IfBlock() {
        _super.constructor.apply(this, arguments);
    }

    method.getName = function() {
        return "if";
    }
    
    return IfBlock;
})();