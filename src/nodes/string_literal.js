var StringLiteral = TemplateExpressionParser.yy.StringLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = StringLiteral.prototype = Object.create(_super);
    
    method.constructor = StringLiteral;
    
    function StringLiteral( str ) {
        _super.constructor.apply(this, arguments);
        this.str = str;
    }
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call string as a function");
    };
    
    method.getStaticType = function() {
        return "string";
    };
    
    method.truthy = function() {
        return this.str.length > 2;
    };
    
    method.isStatic = function() {
        return true;
    };
    
    method.toString = function() {
        if( !this.str ) return "";
        return this.str.replace( /[\n\r\u2028\u2029]/g, function(m){
            if( m === "\n" ) return "\\n";
            if( m === "\r" ) return "\\r";
            return "\\u" + (("0000") + m.charCodeAt(0).toString(16)).slice(-4);
        });
    };
    
    StringLiteral.fromRaw = function( str ) {
        return new StringLiteral('"' + str.replace(/([\\"])/g, "\\$1") + '"');
    };
    
    return StringLiteral;
})();