var MemberExpression = TemplateExpressionParser.yy.MemberExpression = (function() {
    var _super = Node.prototype,
        method = MemberExpression.prototype = Object.create(_super);
    
    method.constructor = MemberExpression;
                
    function MemberExpression( members ) {
        _super.constructor.apply(this, arguments);
        this.lhs = members[0];
        this.rhs = members.length > 1 ? members.slice(1) : [];
        this.init();
    }

    method.children = function() {
            return [this.lhs].concat(this.rhs);
    };
    
    method.replaceChild = function( oldChild, newChild ) {
        if( this.lhs === oldChild ) {
            this.lhs = newChild;
            return true;
        }
        else {
            var rhs = this.rhs,
                len = rhs.length;

            for( var i = 0; i < len; ++i ) {
                if( rhs[i] === oldChild ) {
                    rhs[i] = newChild;
                    return true;
                }
            }
        }
        return false;
    };
    
    method.init = function() {
        if( this.lhs.constructor === ArrayLiteral ) {
            this.checkArrayAccessStaticness();
        }
        else if( this.lhs.isStatic()) {
            this.checkMemberStaticness();
        }
    };

    method.traverse = function( parent, depth, visitorFn, data ) {
        this.lhs.traverse( this, depth + 1, visitorFn, data );
        var rhs = this.rhs,
            len = rhs.length;
            
        for( var i = 0; i < len; ++i ) {
            rhs[i].traverse( this, depth + 1, visitorFn, data );
        }
        visitorFn( this, parent, depth, data );
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
    
    method.removeFromReferences = function() {
        assert( this.lhs instanceof Identifier, "cannot remove non-identifier from references" );
        this.lhs.removeFromReferences();
    };
    
    method.checkMemberStaticness = function() {
        var members = this.rhs,
            member,
            lhs = this.lhs,
            len = members.length;
            

            var member = members[0];

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
            else if( lhs instanceof MapLiteral ) {
                staticResult = this.lhs = lhs.accessMapStatically(member);
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
        
    };
    
    method.boolify = function() {
        return this.lhs.boolify ? this.lhs.boolify() : Operation.boolify( this );
    };
        
            //Get Last
    method.getLast = function() {
        return this.rhs[this.rhs.length-1];
    };


                            //Excludes the last member from the result
    method.toString = function( noLast ) {
        var quotedMember,
            length = noLast ? this.rhs.length - 2 : this.rhs.length - 1;
            
            if( length < 0 ) {
                return this.lhs.toString();
            }
            
            var lhs = this.lhs.toString(),
                members = [];

            for( var i = 0; i < length; ++i ) {
                members.push( this.rhs[i].toStringQuoted() );
            }
            members.push( this.rhs[i].toStringQuoted() );
            
            var ret = "___r.propAccess$"+members.length+"("+lhs+", "+members.join(",") + ")";
            return (this.parens ? '(' + ret + ')' : ret);
        
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
    };

    method.getStaticCoercionType = function() {
        console.assert( this.isStatic(), "Cannot call getStaticCoercionType() on non-static element");
        return this.lhs.getStaticCoercionType();
    };
   
    method.getIdentifier = function() {
        return this.lhs;
    };
    
    method.isStaticallyTruthy = function() {
        console.assert( this.isStatic(), "Cannot call isStaticallyTruthy on non-static element");

        return this.lhs.isStaticallyTruthy();
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