var MemberExpression = TemplateExpressionParser.yy.MemberExpression = (function() {
    var _super = StaticallyResolveableElement.prototype,
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
        this.lhs = members[0];
        this.rhs = members.slice(1) || [];
        this.referenceMode = MemberExpression.referenceMode.NONE;
        this.init();
    }
    
    method.init = function() {
        if( this.lhs.constructor === ArrayLiteral ) {
            this.checkArrayAccessStaticness();
        }
        else if( this.lhs.isStatic()) {
            this.checkMemberStaticness();
        }
        else if( this.lhs.constructor === Identifier ) {
            this.lhs.checkValid();
            MemberExpression.identifiers[this.lhs] = this;
        }
    };
    
    method.checkArrayAccessStaticness = function() {
        var members = this.rhs,
            lhs = this.lhs,
            staticResult,
            len = members.length;
            
            //If the expression is just a sole array, then
            //it is static if the full array is static
        if( len === 0 && lhs.isStatic() ) {
            this.setStatic();
        }
        else if( members[0].isStatic( true ) && ( staticResult = lhs.accessArrayStatically( members[0] ) ) ) {
            this.lhs = staticResult;
            if( len === 1 ) {
                this.rhs = [];
                this.setStatic();
                this.lhs = staticResult.unboxStaticValue();
            }   //Have Further accesses
            else if( !staticResult.memberAccessible() ) {
                //Further access would result in undefined or error
                this.lhs = NullLiteral.INSTANCE;
                this.rhs = [];
                this.setStatic();
            }
            else { //Propagate
                this.rhs.shift();
                this.init();
            }     
        }        
    };
    
    method.checkMemberStaticness = function() {
        var members = this.rhs,
            member,
            lhs = this.lhs,
            len = members.length;
            
        if( !len ) {
            this.lhs = lhs.unboxStaticValue();
            this.setStatic();
        }
        else {
            member = members[0];

            if( !member.isStatic( true ) ) {
                return;
            }

            if( !lhs.memberAccessible() ) {
                this.lhs = NullLiteral.INSTANCE;
                this.rhs = [];
                this.setStatic();
            }   
            else { //The only static thing accessible by now is a string literal or an operation resulting in a string
                var staticResult;
                
                if( lhs instanceof Operation ) {
                    staticResult = this.lhs = lhs.getStaticResolvedOp().accessStringStatically(member);
                }
                else {
                    staticResult = this.lhs = lhs.accessStringStatically(member);
                }
                
                if( len === 1 ) {
                    this.rhs = [];
                    this.lhs = staticResult.unboxStaticValue();
                    this.setStatic();
                }
                else {
                    this.rhs.shift();
                    this.init();
                }
            }
        }
    };
    
    method.boolify = function() {
        return this.lhs.boolify ? this.lhs.boolify() : Operation.boolify( this );
    };
    
    //Pure reference, no member operators
    method.isPureReference = function() {
        return this.rhs.length === 0 && !this.isStatic();
    };
    
    method.removeFromDeclaration = function() {
        if( !this.rhs.length ) {
            delete MemberExpression.identifiers[this.lhs];
        }
    };
        
    method.getLast = function() {
        //Get last member in the member expression
        //If there is only one, this is a normal function call, not a method call
        if( !this.rhs.length ) {
            return null;
        }
        return this.rhs[this.rhs.length-1];
    };
    

    
        //Get everything in the member chain except the last
    method.toStringNoLast = function() {
        var preamble = this.getPreamble(),
            postamble = this.getPostamble(),
            quotedMember;
            
        if( this.rhs.length < 2 ) {
            return preamble + this.lhs.toString() + postamble;
        }
        else {
            var ret = [preamble+"("];
            for( var i = 0; i < this.rhs.length - 2; ++i ) {
                ret.push("(");
            }
            ret.push("("+this.lhs + ") || {})");
            for( var i = 0; i < this.rhs.length - 2; ++i ) {
                quotedMember = this.rhs[i].toStringQuoted();
                if( rinvalidprop.test(quotedMember) ) {
                    this.rhs[i].raiseError("Illegal property access: "+quotedMember);
                }
                ret.push( "[" + quotedMember + "] || {})" );
            }
            quotedMember = this.rhs[i].toStringQuoted();
            if( rinvalidprop.test(quotedMember) ) {
                this.rhs[i].raiseError("Illegal property access: "+quotedMember);
            }
            ret.push( "[" + quotedMember + "]" );
            return ret.join("") + postamble;
        }
    };
    
    method.getPreamble = function() {
        var preamble = "";

        if( this.referenceMode !== MemberExpression.referenceMode.NONE ) {
            var key = this.lhs;
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
                    
        if( this.rhs.length ) {
            var ret = [ preamble + "("];
            for( var i = 0; i < this.rhs.length - 1; ++i ) {
                ret.push("(");
            }
            ret.push("(" + this.lhs + ") || {})");
            for( var i = 0; i < this.rhs.length - 1; ++i ) {
                quotedMember = this.rhs[i].toStringQuoted();
                if( rinvalidprop.test(quotedMember) ) {
                    this.rhs[i].raiseError("Illegal property access: "+quotedMember);
                }
                ret.push( "[" + quotedMember + "] || {})" );
            }
            quotedMember = this.rhs[i].toStringQuoted();
            if( rinvalidprop.test(quotedMember) ) {
                this.rhs[i].raiseError("Illegal property access: "+quotedMember);
            }
            ret.push( "[" + quotedMember + "]" );
            return (this.parens ? '(' + ret.join("") + ')' : ret.join("")) + postamble;
        }
        else {
            return preamble + (this.parens ? '(' + this.lhs + ')' : this.lhs + "")  + postamble;
        }
    };

    method.setReferenceMode = function( mode ) {
        this.referenceMode = mode;
        return this;
    };
    
    method.unboxStaticValue = function() {
        if( !this.isStatic() ) {
            return this;
        }
        return this.lhs.unboxStaticValue();
    };
    
    method.checkValidForFunctionCall = function() {
        if( !this.rhs.length ) {
            this.lhs.checkValidForFunctionCall();
        }
    }

    method.getStaticCoercionType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticCoercionType on non-static member expression");
        }
        
        return this.lhs.getStaticCoercionType();
    };
   
    method.getIdentifier = function() {
        return this.lhs;
    };
    
    method.truthy = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call truthy on non-static member expression");
        }
        return this.lhs.truthy();
    };
    
    method.isBooleanOp = function() {
        return this.isStatic() && (this.lhs.constructor === BooleanLiteral);
    };

    method.toStringQuoted = function() {
        if( this.isStatic() ) {
            return this.unboxStaticValue().toStringQuoted();
        }
        return this.toString();
    };
    
    return MemberExpression;
})();