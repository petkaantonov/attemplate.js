var MemberExpression = (function() {
    var method = MemberExpression.prototype;
    
    MemberExpression.identifiers = {};
        
    function MemberExpression( members ) {
        this.members = members.slice(1) || [];
        this.identifier = members[0];
        
        if( typeof this.identifier === "string") {
            if( rkeyword.test(this.identifier)) {
                throw new Error("'"+this.identifier+"' is used as an identifier but identifiers cannot be Javascript reserved words.");
            }
            else if( rillegal.test(this.identifier)) {
                throw new Error("'"+this.identifier+"' is an illegal reference.");
            }
            else if( rtripleunderscore.test(this.identifier) ) {
                throw new Error( "Identifiers starting with ___ are reserved for internal use." );
            }
            
            if( rjsident.test( this.identifier ) && !rinvalidref.test( this.identifier ) ) {
                MemberExpression.identifiers[this.identifier] = true;
            }
        }

    }
    
    method.isBooleanOp = function() {
        return rfalsetrue.test(this.identifier);
    };
    
    //Pure reference, no member operators
    method.isPureReference = function() {
        return this.members.length === 0;
    };
    
    method.removeFromDeclaration = function() {
        if( !this.members.length ) {
            delete MemberExpression.identifiers[this.identifier];
        }
    };
        
    method.getLast = function() {
        //Get last member in the member expression
        //If there is only one, this is a normal function call, not a method call
        if( !this.members.length ) {
            return null;
        }
        return this.members[this.members.length-1];
    };
    
        //Get everything in the member chain except the last
    method.toStringNoLast = function() {
        if( this.members.length < 2 ) {
            return this.identifier.toString();
        }
        else {
            var ret = [];
            for( var i = 0; i < this.members.length - 1; ++i ) {

                ret.push( this.members[i].toString());    
            }
            return '___propAccess('+this.identifier+', ['+ret.join(", ")+'])';
        }
    };
    
    method.toString = function() {
        if( this.members.length ) {
            var ret = [];
            for( var i = 0; i < this.members.length; ++i ) {
                
                ret.push( this.members[i].toString());    
            }
            return '___propAccess('+this.identifier+', ['+ret.join(", ")+'])';
        }
        else {
            return this.identifier + "";
        }
    };
    
    return MemberExpression;
})();