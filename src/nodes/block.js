var Block = (function() {
    var method = Block.prototype;
    
    function Block() {
        this.statements = [];
    }
    
    method.push = function( statement ) {
        this.statements.push( statement );
    };
    
    method.toString = function() {
        var ret = [];
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        return ret.join("");
    };
    
    method.getStatements = function() {
        return this.statements;
    };
    
    return Block;
})();