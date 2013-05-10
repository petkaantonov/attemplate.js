var TerminalNode = TemplateExpressionParser.yy.TerminalNode = (function() {
    var _super = Node.prototype,
        method = TerminalNode.prototype = Object.create(_super);
    
    method.constructor = TerminalNode;
    
    function TerminalNode() {
        _super.constructor.apply(this, arguments);
    }
    
    method.children = function() {
        return children;
    };
    
    method.replaceChild = function() {
        console.assert(false, "terminal nodes don't have children");
    };
    
    method.traverse = function( parent, depth, visitorFn, data ) {
        visitorFn( this, parent, depth, data );
    };
        
    return TerminalNode;
})();
