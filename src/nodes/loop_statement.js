var LoopStatement = TemplateExpressionParser.yy.LoopStatement = (function() {
    var method = LoopStatement.prototype;
    
    function LoopStatement( statement ) {
        this.statement = statement;
    }
    
    method.toString = function() {
        return this.statement + ";";
    };
    
    return LoopStatement;
})();

