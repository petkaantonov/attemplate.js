var BranchedBlock = TemplateExpressionParser.yy.BranchedBlock = (function() {
    var _super = Block.prototype,
        method = BranchedBlock.prototype = Object.create(_super);
    
    method.constructor = BranchedBlock;
    
    function BranchedBlock() {
        _super.constructor.apply(this, arguments);
    }
  
    return BranchedBlock;
})();
