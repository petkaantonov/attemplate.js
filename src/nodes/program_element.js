var ProgramElement = TemplateExpressionParser.yy.ProgramElement = (function() {
    var method = ProgramElement.prototype;
    
    function ProgramElement() {
        this.startIndex = 0;
        this.endIndex = 0;
        this.indentLevel = 0;
        this.parens = false;
        this.static = false;
    }
    
    method.putCloneProps = function( clonedObj ) {
    };
    
    method.unboxStatic = function() {
        return this;
    };
    
    method.setStatic = function() {
        this.parens = false;
        this.static = true;
    };

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
    
    method.getIndentStr = (function() {
        var levels = {
            0: "",
            1: Array(1*4+1).join(" "),
            2: Array(2*4+1).join(" "),
            3: Array(3*4+1).join(" "),
            4: Array(4*4+1).join(" "),
            5: Array(5*4+1).join(" "),
            6: Array(6*4+1).join(" "),
            7: Array(7*4+1).join(" "),
            8: Array(8*4+1).join(" "),
            9: Array(9*4+1).join(" "),
            10: Array(10*4+1).join(" "),
            11: Array(11*4+1).join(" "),
            12: Array(12*4+1).join(" "),
            13: Array(13*4+1).join(" "),
            14: Array(14*4+1).join(" "),
            15: Array(15*4+1).join(" ")
        };
        
        return function( ) {
            return levels[this.indentLevel] || Array(this.indentLevel*4+1).join(" ");
        };
    })();
        
    method.raiseError = function( msg ) {
        doError(msg, this.startIndex);
    };
    
    return ProgramElement;
})();
