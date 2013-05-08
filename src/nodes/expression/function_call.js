var FunctionCall = TemplateExpressionParser.yy.FunctionCall = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = FunctionCall.prototype = Object.create(_super);
    
    method.constructor = FunctionCall;
    
    function FunctionCall( lhs, args) {
        _super.constructor.apply(this, arguments);
        this.lhs = lhs;
        this.args = args || [];
        this.checkValid();
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
        if( this.lhs.isStatic() ) {
            if( this.lhs.constructor === CallExpression ) {

                var memberQuoted = this.lhs.rhs.toStringQuoted();
                if( rinvalidprop.test(memberQuoted)) {
                    this.lhs.rhs.raiseError( "Illegal method call "+memberQuoted+"." );
                }
            }
            else if( this.lhs.constructor === MemberExpression ) {
                var memberQuoted = this.lhs.getLast().toStringQuoted();
                if( rinvalidprop.test(memberQuoted)) {
                    this.lhs.getLast().raiseError( "Illegal method call "+memberQuoted+"." );
                }
            }
        }
    };
    
    method.toString = function() {
        var argumentsCodeArray = this.convertArgs(),
            last,
            retCode,
            context = 'this';
        
        if( this.lhs.constructor === CallExpression ) {
            var memberQuoted = this.lhs.rhs.toStringQuoted();
            if( argumentsCodeArray.length ) {
                retCode = '___method('+this.lhs.lhs+', '+memberQuoted+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                retCode = '___method('+this.lhs.lhs+', '+memberQuoted+')';
            } 
        }
        else if( this.lhs.constructor === MemberExpression ) {
            var memberQuoted = this.lhs.getLast().toStringQuoted();
            if( argumentsCodeArray.length ) {
                retCode = '___method('+this.lhs.toString( true )+', '+memberQuoted+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                retCode = '___method('+this.lhs.toString( true )+', '+memberQuoted+')';
            }
        }
        else {
            if( argumentsCodeArray.length ) {
                return '___functionCall(this, '+this.lhs.toStringQuoted()+', ['+argumentsCodeArray.join(", ") + '])';
            }
            else {
                return '___functionCall(this, '+this.lhs.toStringQuoted()+')';
            }
        }

        return (this.parens ? "(" + retCode + ")" : retCode);
    };
        
    return FunctionCall;
})();
