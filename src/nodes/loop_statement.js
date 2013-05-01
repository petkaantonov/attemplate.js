var LoopStatement = TemplateExpressionParser.yy.LoopStatement = (function() {
    var _super = ProgramElement.prototype,
        method = LoopStatement.prototype = Object.create(_super);
    
    method.constructor = LoopStatement;
    
    function LoopStatement( statement ) {
        _super.constructor.apply(this, arguments);
        this.statement = statement;
    }
    
    method.toString = function() {
        return this.statement + ";";
    };
    
    return LoopStatement;
})();

