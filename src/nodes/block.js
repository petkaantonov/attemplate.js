var Block = TemplateExpressionParser.yy.Block = (function() {
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
    
    method.performAnalysis = function( parent ) {
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            if( statement instanceof Block ) {
                statement.performAnalysis( this );
            }
            else if( statement.performAnalysis ) {
                statement.performAnalysis( this );
            }
        }
    };
    
    method.getNestedLoops = function() {
        var ret = [];
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            
            statement = this.statements[i];         //Scoped blocks will not share the loops as they are separated from the main function later
            if( !( statement instanceof Block) || statement instanceof ScopedBlock ) {
                continue;
            }
            if( statement instanceof ForeachBlock ) {
                ret.push(statement);
            }

            ret = ret.concat(statement.getNestedLoops());
        }
        return ret;
    };
    
    method.getStatements = function() {
        return this.statements;
    };
    
    return Block;
})();