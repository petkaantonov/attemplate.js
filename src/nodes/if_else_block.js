var IfElseBlock = (function() {
    var _super = HeaderBlock.prototype,
        method = IfElseBlock.prototype = Object.create(_super);
    
    method.constructor = IfElseBlock;
    
    function IfElseBlock() {
        _super.constructor.apply(this, arguments);
    }
    
    method.headerIsBooleanExpression = function() {
        return true;
    };
    
    method.getName = function() {
        return "else if";
    }
    
    return IfElseBlock;
})();