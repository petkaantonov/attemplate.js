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
    
    method.extract = function() {
        return this;
    };
    
    method.traverse = function( parent, depth, visitorFn ) {
        visitorFn( this, parent, depth );
    };
    
    var children = [];
    
    return TerminalNode;
})();
