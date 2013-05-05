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
        this.identifier = members[0];
        this.members = members.slice(1) || [];
        this.referenceMode = MemberExpression.referenceMode.NONE;
        this.init();
    }
    
    method.init = function() {        
        this.static = false;
        this.parens = false;

        if( this.identifier instanceof ArrayLiteral ) {
            this.checkArrayAccessStaticness();
        }
        else if( this.identifier.isStatic()) {
            this.checkMemberStaticness();
        }
        else if( this.identifier instanceof Identifier ) {
            this.identifier.checkValid();
            MemberExpression.identifiers[this.identifier] = this;
        }
    };
    
    method.unboxStatic = function() {
        return this.identifier.unboxStatic();
    };
    
    method.getNormalizedAccessIdentifier = function() {
        return this.identifier.toStringQuoted();
    };
    
    method.checkArrayAccessStaticness = function() {
        var members = this.members,
            id = this.identifier,
            staticResult,
            len = members.length;
            
            //If the expression is just a sole array, then
            //it is static if the full array is static
        if( len === 0 && id.isStatic() ) {
            this.setStatic();
        }
        else if( members[0].isStatic( true ) && ( staticResult = id.accessArrayStatically( members[0] ) ) ) {
            this.identifier = staticResult;
            if( len === 1 ) {
                this.members = [];
                this.setStatic();
            }   //Have Further accesses
            else if( !staticResult.memberAccessible() ) {
                //Further access would result in undefined or error
                this.identifier = NullLiteral.INSTANCE;
                this.members = [];
                this.setStatic();
            }
            else { //Propagate
                this.members.shift();
                this.init();
            }     
        }        
    };
    
    method.checkMemberStaticness = function() {
        var members = this.members,
            member,
            id = this.identifier,
            len = members.length;
            
        if( !len ) {
            this.setStatic();
        }
        else {
            member = members[0];

            if( !member.isStatic( true ) ) {
                return;
            }

            if( !id.memberAccessible() ) {
                this.identifier = NullLiteral.INSTANCE;
                this.members = [];
                this.setStatic();
            }   
            else { //The only static thing accessible by now is a string literal or an operation resulting in a string
                var staticResult;
                
                if( id instanceof Operation ) {
                    staticResult = this.identifier = id.getStaticResolvedOp().accessStringStatically(member);
                }
                else {
                    staticResult = this.identifier = id.accessStringStatically(member);
                }
                
                if( len === 1 ) {
                    this.members = [];
                    this.setStatic();
                }
                else {
                    this.members.shift();
                    this.init();
                }
            }
        }
    };
    
    method.boolify = function() {
        return this.identifier.boolify ? this.identifier.boolify() : Operation.boolify( this );
    };
    
    method.checkValidForFunctionCall = function() {
        this.identifier.checkValidForFunctionCall();
    }    
    method.setReferenceMode = function( mode ) {
        this.referenceMode = mode;
    };
    
    method.getStaticCoercionType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticCoercionType on non-static member expression");
        }
        
        return this.identifier.getStaticCoercionType();
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
        this.parens = false;
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
            postamble = this.getPostamble(),
            quotedMember;
            
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
                quotedMember = this.members[i].toStringQuoted();
                if( rinvalidprop.test(quotedMember) ) {
                    this.members[i].raiseError("Illegal property access: "+quotedMember);
                }
                ret.push( "[" + quotedMember + "] || {})" );
            }
            quotedMember = this.members[i].toStringQuoted();
            if( rinvalidprop.test(quotedMember) ) {
                this.members[i].raiseError("Illegal property access: "+quotedMember);
            }
            ret.push( "[" + quotedMember + "]" );
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
            quotedMember,
            postamble = this.getPostamble();
                    
        if( this.members.length ) {
            var ret = [ preamble + "("];
            for( var i = 0; i < this.members.length - 1; ++i ) {
                ret.push("(");
            }
            ret.push("(" + this.identifier + ") || {})");
            for( var i = 0; i < this.members.length - 1; ++i ) {
                quotedMember = this.members[i].toStringQuoted();
                if( rinvalidprop.test(quotedMember) ) {
                    this.members[i].raiseError("Illegal property access: "+quotedMember);
                }
                ret.push( "[" + quotedMember + "] || {})" );
            }
            quotedMember = this.members[i].toStringQuoted();
            if( rinvalidprop.test(quotedMember) ) {
                this.members[i].raiseError("Illegal property access: "+quotedMember);
            }
            ret.push( "[" + quotedMember + "]" );
            return (this.parens ? '(' + ret.join("") + ')' : ret.join("")) + postamble;
        }
        else {
            return preamble + (this.parens ? '(' + this.identifier + ')' : this.identifier + "")  + postamble;
        }
    };

    method.toStringQuoted = function() {
        if( this.static ) {
            return this.identifier.toStringQuoted();
        }
        return this.toString();
    };
    
    return MemberExpression;
})();