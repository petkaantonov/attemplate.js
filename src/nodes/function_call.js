var FunctionCall = TemplateExpressionParser.yy.FunctionCall = (function() {
    var _super = ProgramElement.prototype,
        method = FunctionCall.prototype = Object.create(_super);
    
    method.constructor = FunctionCall;
    
    function FunctionCall( expr, args) {
        _super.constructor.apply(this, arguments);
        this.expr = expr;
        this.args = args || [];
        this.static = false;
        this.isMap = false;
        this.checkSpecials(); //Handle special function calls
    }

    method.checkValidForFunctionCall = function() {
        if( this.isMap ) {
            this.raiseError("Cannot call map as a function");
        }
    };
    
    method.accessMapStatically = function( member ) {
        if( !this.isMap ) {
            throw new Error("Cannot do static map access on non-map");
        }
        var name = member.toStringQuoted(),
            arg,
            j = 0;
        
        for( var i = 0; i < this.args.length; ++i ) {
            arg = this.args[i];
            if( arg instanceof NamedArgument ) {
                if( arg.getNameQuoted() !== name ) {
                    continue;
                }
                if( !arg.isStatic() ) {
                    throw new Error("Cannot do static map access on non-static key.");
                }
                return arg.getValue();
            }
            else {
                if( name === '"' + j + '"') {
                    if( !arg.isStatic() ) {
                        throw new Error("Cannot do static map access on non-static key.");
                    }
                    return arg.getValue();
                }
                j++;
            }
        }
        //Undefined is not supported
        return NullLiteral.INSTANCE;
    };
    //Determine if $(...).prop is a static access
    method.isStaticMapAccess = function( member ) {
        if( !this.isMap ) {
            throw new Error("Cannot do static map access on non-map");
        }
        var name = member.toStringQuoted(),
            arg,
            j = 0;
                    
        for( var i = 0; i < this.args.length; ++i ) {
            arg = this.args[i];
            
            if( arg instanceof NamedArgument ) {
                if( arg.getNameQuoted() !== name ) {
                    continue;
                }
                return arg.isStatic();
            }
            else {
                if( name === '"' + j + '"') {
                    return arg.isStatic();
                }
                j++;
            }
        }
        //The member is static and does not exist in map for sure, so it's going to
        //result in undefined
        return true;
    };

    method.isStatic = function() {
        return this.static;
    };
        
    method.setStatic = function() {
        this.static = true;
    };
    
    //Inline a map
    function toStringMapSpecial() {
        return this.convertArgs(true)[0];
    }
    
    method.checkSpecials = function() {
        var expr = this.expr;
        //Convert a call like $(asd: daa, dasd: daa) into a {'asd': daa, 'dasd': daa} object literal
        if( expr.identifier instanceof Identifier &&
            expr.identifier.toString() === "$" &&
            expr.isPureReference()
        ) {
            expr.removeFromDeclaration();
            this.toString = toStringMapSpecial;
            this.isMap = true;
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
        else if( forceNamed ) {
            return ["{}"];
        }
        return [];
    };
    
    method.toString = function() {
        var ret = this.convertArgs(),
            last,
            context = 'this';
        
        if( this.expr instanceof CallExpression ) {
            var memberQuoted = this.expr.member.toStringQuoted();
            if( rinvalidprop.test(memberQuoted)) {
                this.expr.member.raiseError( "Illegal method call "+memberQuoted+"." );
            }
            if( ret.length ) {
                return '___method('+this.expr.fn+', '+memberQuoted+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.expr.fn+', '+memberQuoted+')';
            } 
        }

        if( (last = ( this.expr.getLast && this.expr.getLast() ) ) ) {
            var memberQuoted = last.toStringQuoted();
            if( rinvalidprop.test(memberQuoted)) {
                last.raiseError( "Illegal method call "+memberQuoted+"." );
            }
            if( ret.length ) {
                return '___method('+this.expr.toStringNoLast()+', '+memberQuoted+', ['+ret.join(", ") + '])';
            }
            else {
                return '___method('+this.expr.toStringNoLast()+', '+memberQuoted+')';
            }
        }
        else {
            this.expr.checkValidForFunctionCall();

        }
        var expr = this.expr.toStringQuoted();
  
        if( rinvalidprop.test(expr)) {
            this.expr.raiseError( "Illegal function call "+expr +"." );
        }
        if( ret.length ) {
            return '___functionCall(this, '+expr+', ['+ret.join(", ") + '])';
        }
        else {
            return '___functionCall(this, '+expr+')';
        }

        
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };
    
    return FunctionCall;
})();
