var MemberExpression = TemplateExpressionParser.yy.MemberExpression = (function() {
    var _super = ProgramElement.prototype,
        method = MemberExpression.prototype = Object.create(_super);
    
    method.constructor = MemberExpression;
    
    /*Those who are already set*/
    
    MemberExpression.identifiers = {};
    MemberExpression.referenceMode = {
        DATA_ARGUMENT: {},
        SELF_ONLY: {},
        NONE: {}
    };
        
    function MemberExpression( members ) {
        _super.constructor.apply(this, arguments);
        this.members = members.slice(1) || [];
        this.identifier = members[0];
        this.static = false;
        this.referenceMode = MemberExpression.referenceMode.NONE;
    
        if( this.members.length === 0 && this.identifier.isStatic && this.identifier.isStatic()) {
            this.setStatic();
        }
        else if( this.identifier instanceof Identifier ) {
            this.identifier.checkValid();
            MemberExpression.identifiers[this.identifier] = this;
        }
    }
    
    method.boolify = function() {
        return this.identifier.boolify ? this.identifier.boolify() : Operation.boolify( this );
    };
    
    method.checkValidForFunctionCall = function() {
        this.identifier.checkValidForFunctionCall();
    }    
    method.setReferenceMode = function( mode ) {
        this.referenceMode = mode;
    };
    
    method.getStaticType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticType on non-static member expression");
        }
        
        return this.identifier.getStaticType();
    };
    
    method.getIdentifier = function() {
        return this.identifier;
    };
    
    method.truthy = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call truthy on non-static member expression");
        }
        return this.identifier.truthy();
    };
    
    method.isStatic = function() {
        return this.static;
    };
    
    method.setStatic = function() {
        this.static = true;
    };
    
    method.isPureNumber = function() {
        return this.isStatic() && (this.identifier instanceof NumericLiteral);
    };
    
    method.isNegativePureNumber = function() {
        return (this.isPureNumber() && this.identifier.isNegative());
    };
    
    method.isBooleanOp = function() {
        return this.isStatic() && (this.identifier instanceof BooleanLiteral);
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
        var preamble = this.getPreamble(),
            postamble = this.getPostamble();
        if( this.members.length < 2 ) {
            return preamble + this.identifier.toString() + postamble;
        }
        else {
            var ret = [preamble+"("];
            for( var i = 0; i < this.members.length - 2; ++i ) {
                ret.push("(");
            }
            ret.push("("+this.identifier + ") || {})");
            for( var i = 0; i < this.members.length - 2; ++i ) {

                ret.push( "[" + this.members[i].toString() + "] || {})" );
            }
            ret.push( "[" + this.members[i].toString() + "]" );
            return ret.join("") + postamble;
        }
    };
    
    method.getPreamble = function() {
        var preamble = "";

        if( this.referenceMode !== MemberExpression.referenceMode.NONE ) {
            var key = this.identifier;
            switch( this.referenceMode ) {
                case MemberExpression.referenceMode.DATA_ARGUMENT: 
                    preamble = "(" + key + " = (___hasown.call(___data, '"+key+"' ) ? ___data."+key+":"+
                                   "___hasown.call(this, '"+key+"' ) ? this."+key+" : ___ext." + key + "),";
                break;
                
                case MemberExpression.referenceMode.SELF_ONLY:
                    preamble = "(" + key + " = (___hasown.call(this, '"+key+"' ) ? this."+key+": ___ext." + key + "),";
                break;
            
            }
        }
        return preamble;
    };
    
    method.getPostamble = function() {
        if( this.referenceMode !== MemberExpression.referenceMode.NONE ) {
            return ")";
        }
        return "";
    };
    
    method.toString = function() {
        var preamble = this.getPreamble(),
            postamble = this.getPostamble();
                    
        if( this.members.length ) {
            var ret = [ preamble + "("];
            for( var i = 0; i < this.members.length - 1; ++i ) {
                ret.push("(");
            }
            ret.push("(" + this.identifier + ") || {})");
            for( var i = 0; i < this.members.length - 1; ++i ) {
                ret.push( "[" + this.members[i].toString() + "] || {})" );
            }
            ret.push( "[" + this.members[i].toString() + "]" );
            return (this.parens ? '(' + ret.join("") + ')' : ret.join("")) + postamble;
        }
        else {
            return preamble + (this.parens ? '(' + this.identifier + ')' : this.identifier + "")  + postamble;
        }
    };
    
    return MemberExpression;
})();