var Identifier = TemplateExpressionParser.yy.Identifier = (function() {
    var _super = TerminalNode.prototype,
        method = Identifier.prototype = Object.create(_super);
    
    method.constructor = Identifier;
    
    function Identifier( identifier ) {
        _super.constructor.apply(this, arguments);
        this.identifier = identifier;
    }
    
    method.usedAsReference = function() {
        this.checkValid();
        Identifier.references.set( this.toString(), this );
    };
    
    method.checkValid = function() {
        if( !rjsident.test( this.identifier ) ) {
            this.raiseError( "'" + this.identifier + "' is not a valid identifier.");    
        }
        else if( rkeyword.test(this.identifier)) {
            this.raiseError("'"+this.identifier+"' is used as an identifier but identifiers cannot be Javascript reserved words.");
        }
        else if( rtripleunderscore.test(this.identifier) ) {
            this.raiseError( "Identifiers starting with ___ are reserved for internal use." );
        }
    };
    
    method.removeFromReferences = function() {
        Identifier.references.remove( this.toString() );
    };
    
    method.checkValidForFunctionCall = function() {
    };
    

    method.toString = function() {
        return this.identifier;
    };
    
    method.asStringLiteral = function() {
        return StringLiteral.fromRaw( this.identifier );
    };
    
    Identifier.references = new Map();
    
    Identifier.refreshReferenceMap = function() {
        Identifier.references = new Map();
    };
    
    //TODO Seems hacky
    Identifier.getSeenReferences = function() {
        var ret = Identifier.references;
        Identifier.refreshReferenceMap();
        return ret;
    };
    
    return Identifier;
})();
