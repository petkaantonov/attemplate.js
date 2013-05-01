var FunctionCall = TemplateExpressionParser.yy.FunctionCall = (function() {
    var method = FunctionCall.prototype;
    
    function FunctionCall( expr, args) {
        this.expr = expr;
        this.args = args || [];
        
        this.checkSpecials(); //Handle special function calls
    }
    
    method.isStatic = function() {
        return false;
    };
    
    //Inline a map
    function toStringMapSpecial() {
        return this.convertArgs(true)[0];
    }
    
    method.checkSpecials = function() {

        if( this.expr.identifier === "$" &&
            this.expr.isPureReference()
        ) {
            this.expr.removeFromDeclaration();
            this.toString = toStringMapSpecial;
        }
        
    }
    
    method.getDirectRefName = function() {
        if( this.expr.getLast && this.expr.getLast() ) {
            return null;
        }
        else if( this.expr instanceof CallExpression ) {
            return null;
        }

        return this.expr.identifier.toString();
        
    };
                                
    method.convertArgs = function( forceNamed ) {
        if( this.args.length ) {
            var namedArgs = [], normalArgs = [];
            var j = 0;
            for( var i = 0; i < this.args.length; ++i ) {
                if( this.args[i] instanceof NamedArgument ) {
                    namedArgs.push( this.args[i].toString());
                }
                else {//Force correct object literal even if not all args are named
                    forceNamed ?
                        namedArgs.push( "'" + (j++) + "': " + this.args[i].toString() ) :
                        normalArgs.push( this.args[i].toString() );
                }
            }
            
            if( namedArgs.length ) {
                var namedArg = "{" + namedArgs.join(", ") + "}";
                normalArgs.unshift(namedArg);
            }
            else if( forceNamed ) {
                return ["{}"];
            }
            
            return normalArgs;
        }
        return [];
    };
    
    method.toString = function() {
        var ret = this.convertArgs(),
            last,
            context = 'this';
        
        if( this.expr instanceof CallExpression ) {
            if( ret.length ) {
                return '___method('+this.expr.fn+', '+this.expr.member+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.expr.fn+', '+this.expr.member+')';
            } 
        }

        if( (last = ( this.expr.getLast && this.expr.getLast() ) ) ) {
            if( ret.length ) {
                return '___method('+this.expr.toStringNoLast()+', '+last.toString()+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.expr.toStringNoLast()+', '+last.toString()+')';
            }
        }
        else if( rinvalidref.test(this.expr.identifier) ) {
            throw new Error("Cannot call '"+this.expr.identifier+"' as a function");
        }
        else {
            var expr = this.expr.toString();
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
