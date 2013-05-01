var ProgramElement = TemplateExpressionParser.yy.ProgramElement = (function() {
    var method = ProgramElement.prototype;
    
    function ProgramElement() {
        this.startIndex = 0;
        this.endIndex = 0;
        this.indentLevel = 0;
    }
    
    method.setEndIndex = function( endIndex ) {
        this.endIndex = endIndex;
        return this;
    };
    
    method.setStartIndex = function( startIndex ) {
        this.startIndex = startIndex;
        return this;
    };
    
    method.setIndentLevel = function( level ) {
        this.indentLevel = level;
        return this;
    };
    
    method.raiseError = function( msg ) {
        doError(msg, this.startIndex);
    };
    
    return ProgramElement;
})();
