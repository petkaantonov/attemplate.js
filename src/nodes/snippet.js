var Snippet = TemplateExpressionParser.yy.Snippet = (function() {
    var _super = ProgramElement.prototype,
        method = Snippet.prototype = Object.create(_super);
    
    method.constructor = Snippet;
    
    function Snippet( expr ) {
        _super.constructor.apply(this, arguments);
        this.expr = expr;
    }
    
    method.getExpression = function() {
        return this.expr;
    };
    
    method.toString = function() {
        return this.expr ? this.expr.toString() : "";
    };
   
    //Capture naked var accesses so we can declare them
    //Declared vars avoids reference errors and we can just output empty string
        
    method.getNakedVarReferences = function() {
        var ret = MemberExpression.identifiers;
        MemberExpression.identifiers = {};
        return ret;
    };
       
    return Snippet;
})();