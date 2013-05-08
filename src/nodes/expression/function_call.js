var FunctionCall = TemplateExpressionParser.yy.FunctionCall = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = FunctionCall.prototype = Object.create(_super);
    
    method.constructor = FunctionCall;
    
    function FunctionCall( lhs, args) {
        _super.constructor.apply(this, arguments);
        this.lhs = lhs;
        this.args = args || [];
        this.checkValid();
        this.isHelperCall = false;
        FunctionCall.calls.push( this );
    }
                                
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
    
    method.checkValid = function() {
        this.lhs.checkValidForFunctionCall();
    };
    
    method.toString = function() {
        var argumentsCodeArray = this.convertArgs(),
            last,
            retCode,
            context = 'this';
        
        
        if( this.isHelperCall ) {
            if( argumentsCodeArray.length ) {
                retCode = this.lhs+'(' + argumentsCodeArray.join(", ") + ')'
            }
            else {
                retCode = this.lhs + '()'
            }
        }
        else if( this.lhs.constructor === CallExpression ) {
            var memberQuoted = this.lhs.rhs.toStringQuoted();
            if( argumentsCodeArray.length ) {
                retCode = '___r.method('+this.lhs.lhs+', '+memberQuoted+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                retCode = '___r.method('+this.lhs.lhs+', '+memberQuoted+')';
            } 
        }
        else if( this.lhs.constructor === MemberExpression ) {
            var memberQuoted = this.lhs.getLast().toStringQuoted();
            if( argumentsCodeArray.length ) {
                retCode = '___r.method('+this.lhs.toString( true )+', '+memberQuoted+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                retCode = '___r.method('+this.lhs.toString( true )+', '+memberQuoted+')';
            }
        }
        else {
            if( argumentsCodeArray.length ) {
                retCode = '___r.functionCall(this, '+this.lhs.toStringQuoted()+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                retCode = '___r.functionCall(this, '+this.lhs.toStringQuoted()+')';
            }
        }

        return (this.parens ? "(" + retCode + ")" : retCode);
    };
    
    method.markAsHelperCall = function() {
        this.isHelperCall = true;
    };
    
    
    FunctionCall.calls = [];
    
    var it = function( key, value ) {
        if( value === null ) {
            var name = key;
        }
        else {
            var name = value.length ? value[0] : key;
        }
        var calls = FunctionCall.calls;

        for( var i = 0; i < calls.length; ++i ) {
            var call = calls[i];

            if( call.lhs instanceof Identifier &&
                call.lhs.toString() === name
            ) {
                call.markAsHelperCall();
            }

        }
    };
    
    //TODO: Horrible, horrible
    FunctionCall.markHelperCalls = function( importMap ) {        
        importMap.forEach( it );
    };
    
    FunctionCall.flush = function() {
        FunctionCall.calls = [];
    };
        
    return FunctionCall;
})();
