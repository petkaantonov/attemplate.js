var MapLiteral = TemplateExpressionParser.yy.MapLiteral = (function() {
    var _super = StaticallyResolveableElement.prototype,
        method = MapLiteral.prototype = Object.create(_super);
    
    method.constructor = MapLiteral;
    
    function MapLiteral( namedArgs ) {
        _super.constructor.apply(this, arguments);
        this.namedArgs = namedArgs;
        
        var isStatic = true;
        for( var i = 0; i < namedArgs.length; ++i ) {
            if( !namedArgs[i].isStatic() ) {
                isStatic = false;
                break;
            }
        }
        if( isStatic ) {
            this.setStatic();
        }
    }
    
    method.toNumberValue = function() {
        _super.toNumberValue.call( this );
        return 0;
    };
    
    method.toStringValue = function() {
        _super.toStringValue.call( this );
        return '[object Map]';
    };
    
    method.toStringQuoted = function() {
        return '"[object Map]"';
    }
    
    method.truthy = function() {
        return true;
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call map as a function");
    };
    
    method.accessMapStatically = function( member ) {
        var name = member.toStringQuoted(),
            arg,
            j = 0;
        
        for( var i = 0; i < this.args.length; ++i ) {
            arg = this.args[i];
            if( arg.constructor === NamedArgument ) {
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
        if( this.isStatic() ) {
            return true;
        }
        var name = member.toStringQuoted(),
            arg,
            j = 0;
                    
        for( var i = 0; i < this.args.length; ++i ) {
            arg = this.args[i];
            
            if( arg.constructor === NamedArgument ) {
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
    
    method.memberAccessible = function() {
        return true;
    };
        
    method.toString = function() {
        var args = this.namedArgs;
        
        if( !args.length ) {
            return this.parens ? "({})" : "{}";
        }

        var namedArgs = [],
            j = 0;
            
        for( var i = 0; i < args.length; ++i ) {
            if( args[i].constructor === NamedArgument ) {
                namedArgs.push( args[i].toString());
            }
            else {//Force correct object literal even if not all args are named
                namedArgs.push( "'" + (j++) + "': " + args[i].toString() );
            }
        }
        return this.parens ? "({" + namedArgs.join(", ") + "})" : "{" + namedArgs.join(", ") + "}";         
    };
 
    return MapLiteral;
})();
