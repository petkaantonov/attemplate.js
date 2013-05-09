var AssignmentList = TemplateExpressionParser.yy.AssignmentList = (function() {
    var _super = Node.prototype,
        method = AssignmentList.prototype = Object.create(_super);
    
    method.constructor = AssignmentList;
    
    function AssignmentList( elements ) {
        _super.constructor.apply(this, arguments);
        this.elements = elements || [];
    }
    
    method.toString = function() {
        return this.elements.join(";");
    };
    
    return AssignmentList;
})();
