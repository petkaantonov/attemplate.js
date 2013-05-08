var Block = TemplateExpressionParser.yy.Block = (function() {
    var _super = ProgramElement.prototype,
        method = Block.prototype = Object.create(_super);

    method.constructor = Block;
    
    function Block() {
        _super.constructor.apply(this, arguments);
        this.statements = [];
    }
    
    method.putCloneProps = function( clonedObj ) {
        _super.putCloneProps.call( this, clonedObj );
        clonedObj.statements = this.statements.slice(0);
    };
    
    method.isBranched = function() {
        return false;
    };
        
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
    
    method.setIndentLevel = function( level ) {
        _super.setIndentLevel.call( this, level );
        for( var i = 0; i < this.statements.length; ++i ) {
            this.statements[i].setIndentLevel( level + 1 );
        }
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
    
    method.indexOfChild = function( child ) {
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            
            if( statement === child ) {
                return i;
            }
        }
        return -1;
    };
    
    method.insertChildAfter = function( haveChild, insertChild) {
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            
            if( statement === haveChild ) {
                this.statements.splice(i+1, 0, insertChild);
                break;
            }
        }
    };

    method.insertChildBefore = function( haveChild, insertChild) {
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            
            if( statement === haveChild ) {
                this.statements.splice(i, 0, insertChild);
                break;
            }
        }
    };
    
    method.prependChild = function( child ) {
        this.statements.unshift( child );
    };
    
    method.appendChild = function( child ) {
        this.statements.push( child );
    };
    
    method.insertChildAt = function( index, child) {
        if( typeof index !== "number" ) {
            index = this.indexOfChild(index);
        }
        if( index >= this.statements.length ) {
            this.appendChild(child);
        }
        else if( index < 0 ) {
            this.prependChild(child);

        }
        else {
            this.statements.splice( index, 0, child);
        }
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        var index = this.indexOfChild( oldChild );
        if( index < 0 ) {
            return;
        }
        
        this.statements[index] = newChild;
    };
    
    method.removeChild = function( child ) {
        var statement;
        for( var i = 0; i < this.statements.length; ++i ) {
            statement = this.statements[i];
            
            if( statement === child ) {
                this.statements.splice(i, 1);
                return child;
            }
        }
    };
    //More performant for removing multiple consecutive children
    method.removeChildrenAt = function( index, count ) {
        if( typeof index === "number" ) {
            this.statements.splice( index, count );
        }
        else if( ( index = this.indexOfChild(index) ) > -1 ) {
            this.statements.splice( index, count );
        }
    };
   
    return Block;
})();