var Snippet = TemplateExpressionParser.yy.Snippet = (function() {
    var _super = ProgramElement.prototype,
        method = Snippet.prototype = Object.create(_super);
    
    method.constructor = Snippet;
    
    function Snippet( expr ) {
        _super.constructor.apply(this, arguments);
        this.expr = expr;
    }
    
    method.children = function() {
        return [this.expr];
    };
    
    method.traverse = function( visitorFn, data ) {
        this.expr.traverse( this, 0, visitorFn, data || {} );
    };
    
    method.getExpression = function() {
        return this.expr;
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        if( this.expr === oldChild ) {
            this.expr = newChild;
            return true;
        }
        return false;
    };
    
    method.toString = function() {
        return this.expr ? this.expr.toString() : "";
    };

   
    //Capture naked var accesses so we can declare them
    //Declared vars avoids reference errors and we can just output empty string
        
    method.getSeenReferences = function() {
        return Identifier.getSeenReferences();
    };
       
    return Snippet;
})();