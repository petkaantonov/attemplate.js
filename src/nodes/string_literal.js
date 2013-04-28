var StringLiteral = (function() {
    var method = StringLiteral.prototype;
    
    function StringLiteral( str ) {
        this.str = str;
    }
    
    method.toString = function() {
        if( !this.str ) return "";
        return this.str.replace( /[\n\r\u2028\u2029]/g, function(m){
            if( m === "\n" ) return "\\n";
            if( m === "\r" ) return "\\r";
            return "\\u" + (("0000") + m.charCodeAt(0).toString(16)).slice(-4);
        });
    };
    
    return StringLiteral;
})();