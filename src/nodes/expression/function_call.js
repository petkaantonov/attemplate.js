var FunctionCall = TemplateExpressionParser.yy.FunctionCall = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = FunctionCall.prototype = Object.create(_super);
    
    method.constructor = FunctionCall;
    
    function FunctionCall( lhs, args) {
        _super.constructor.apply(this, arguments);
        this.lhs = lhs;
        this.args = args || [];
        this.lhs.checkValidForFunctionCall();
    }

    method.getDirectRefName = function() {
        if( this.lhs.constructor === CallExpression ) {
            return null;
        }
        else if( this.lhs.isPureReference() ) {
            return null;
        }

        return this.lhs.lhs.toString();
        
    };
                                
    method.convertArgs = function() {
        if( this.args.length ) {
            var namedArgs = [], normalArgs = [];
            var j = 0;
            for( var i = 0; i < this.args.length; ++i ) {
                if( this.args[i].constructor === NamedArgument ) {
                    namedArgs.push( this.args[i].toString());
                }
                else {
                    normalArgs.push( this.args[i].toString() );
                }
            }
            
            if( namedArgs.length ) {
                var namedArg = "{" + namedArgs.join(", ") + "}";
                normalArgs.unshift(namedArg);
            }            
            return normalArgs;
        }
        return [];
    };
    
    method.toString = function() {
        var ret = this.convertArgs(),
            last,
            context = 'this';
        
        if( this.lhs.constructor === CallExpression ) {
            var memberQuoted = this.lhs.rhs.toStringQuoted();
            if( rinvalidprop.test(memberQuoted)) {
                this.lhs.rhs.raiseError( "Illegal method call "+memberQuoted+"." );
            }
            if( ret.length ) {
                return '___method('+this.lhs.lhs+', '+memberQuoted+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.lhs.lhs+', '+memberQuoted+')';
            } 
        }
        
       
        if( (last = this.lhs.getLast() ) ) {
            var memberQuoted = last.toStringQuoted();
            if( rinvalidprop.test(memberQuoted)) {
                last.raiseError( "Illegal method call "+memberQuoted+"." );
            }
            if( ret.length ) {
                return '___method('+this.lhs.toStringNoLast()+', '+memberQuoted+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.lhs.toStringNoLast()+', '+memberQuoted+')';
            }
        }
        var expr = this.lhs.toStringQuoted();
  
        if( rinvalidprop.test(expr)) {
            this.lhs.raiseError( "Illegal function call "+expr +"." );
        }
        if( ret.length ) {
            return '___functionCall(this, '+expr+', ['+ret.join(", ") + '])';
        }
        else {
            return '___functionCall(this, '+expr+')';
        }

        
    };
        
    return FunctionCall;
})();
