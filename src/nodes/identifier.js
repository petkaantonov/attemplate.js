var Identifier = TemplateExpressionParser.yy.Identifier = (function() {
    var _super = ProgramElement.prototype,
        method = Identifier.prototype = Object.create(_super);
    
    method.constructor = Identifier;
    
    function Identifier( identifier ) {
        _super.constructor.apply(this, arguments);
        this.identifier = identifier;
    }
    
    method.checkValid = function() {
        if( !rjsident.test( this.identifier ) ) {
            this.raiseError( "'" + this.identifier + "' is not a valid identifier.");    
        }
        else if( rkeyword.test(this.identifier)) {
            this.raiseError("'"+this.identifier+"' is used as an identifier but identifiers cannot be Javascript reserved words.");
        }
        else if( rillegal.test(this.identifier)) {
            this.raiseError("'"+this.identifier+"' is an illegal reference.");
        }
        else if( rtripleunderscore.test(this.identifier) ) {
            this.raiseError( "Identifiers starting with ___ are reserved for internal use." );
        }
    };
    
    method.checkValidForFunctionCall = function() {
        if( rinvalidref.test(this.identifier) ) {
            this.raiseError("Cannot call '"+this.identifier+"' as a function");
        }
    };
    
    method.toString = function() {
        return this.identifier;
    };
    
    method.isStatic = function() {
        return false;
    };

    
    return Identifier;
})();
