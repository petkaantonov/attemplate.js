var Snippet = (function() {
    var method = Snippet.prototype;
    
    function Snippet( expr ) {
        this.expr = expr;


    }
    
    method.toString = function() {
        return this.expr ? this.expr.toString() : "";
    };
    

   
    //Capture naked var accesses so we can declare them
    //Declared vars avoids reference errors and we can just output empty string
        
    method.getNakedVarReferences = function() {
        var ret = MemberExpression.identifiers;
        MemberExpression.identifiers = {};
        return ret;
    };
    
    return Snippet;
})();

var CallExpression = (function() {
    var method = CallExpression.prototype;
    
    function CallExpression( fn, mem ) {
        this.fn = fn;
        this.member = mem;
    }
    
    method.toString = function() {
        return '___propAccess(' +this.fn.toString() + ', ['+this.member.toString()+'])';
    };
    
    return CallExpression;
})();

var rinvalidref = /^(?:null|false|true|this)$/;

var MemberExpression = (function() {
    var method = MemberExpression.prototype;
    
    MemberExpression.identifiers = {};
    
    //Should be used for helper names too
    var rkeyword = /^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with|class|enum|export|extends|import|super|implements|interface|let|package|private|protected|public|static|yield)$/;
    var rillegal= /^(?:Function|String|Boolean|Number|Array|Object|eval)$/;
    var rfalsetrue = /^(?:false|true)$/;
    var rtripleunderscore = /^___/;
    var rjsident = /^[a-zA-Z$_][a-zA-Z$_0-9]*$/;
    
    function MemberExpression( members ) {
        this.members = members.slice(1) || [];
        this.identifier = members[0];
        
        if( typeof this.identifier === "string") {
            if( rkeyword.test(this.identifier)) {
                throw new Error("'"+this.identifier+"' is used as an identifier but identifiers cannot be Javascript reserved words.");
            }
            else if( rillegal.test(this.identifier)) {
                throw new Error("'"+this.identifier+"' is an illegal reference.");
            }
            else if( rtripleunderscore.test(this.identifier) ) {
                throw new Error( "Identifiers starting with ___ are reserved for internal use." );
            }
            
            if( rjsident.test( this.identifier ) && !rinvalidref.test( this.identifier ) ) {
                MemberExpression.identifiers[this.identifier] = true;
            }
        }

    }
    
    method.isBooleanOp = function() {
        return rfalsetrue.test(this.identifier);
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
        if( this.members.length < 2 ) {
            return this.identifier.toString();
        }
        else {
            var ret = [];
            for( var i = 0; i < this.members.length - 1; ++i ) {

                ret.push( this.members[i].toString());    
            }
            return '___propAccess('+this.identifier+', ['+ret.join(", ")+'])';
        }
    };
    
    method.toString = function() {
        if( this.members.length ) {
            var ret = [];
            for( var i = 0; i < this.members.length; ++i ) {
                
                ret.push( this.members[i].toString());    
            }
            return '___propAccess('+this.identifier+', ['+ret.join(", ")+'])';
        }
        else {
            return this.identifier + "";
        }
    };
    
    return MemberExpression;
})();

var FunctionCall = (function() {
    var method = FunctionCall.prototype;
    
    function FunctionCall( expr, args) {
        this.expr = expr;
        this.args = args || [];
        
        this.checkSpecials(); //Handle special function calls
    }
    
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
                normalArgs.push(namedArg);
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
            context = 'this';
        
        if( this.expr.getLast ) {
            var last = this.expr.getLast();
        }
        
        if( last ) {
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

var Operation = (function() {
    var method = Operation.prototype;
    
    var rrelational = /^(?:<|>|>=|<=)$/;

    
    function isBooleanOp( obj ) {
        return obj.isBooleanOp && obj.isBooleanOp() || false;
    }
    
    function Operation( opStr, op1, op2, isTernary) {
        this.isTernary = !!isTernary;
        this.isUnary = op2 == null;
        this.opStr = opStr;
        this.op1 = op1;
        this.op2 = op2;
        this.madeRelational = false;
    }
    
    method.isBooleanOp = function() {
        return this.opStr === "in" || this.opStr === "!" ;
    };

    method.isRelational = function() {
        return rrelational.test( this.opStr );
    };
        
    method.toString = function() {
        var ret;
      
        if( this.isTernary ) {
            var condition = isBooleanOp(this.opStr) ? this.opStr.toString() : '___boolOp('+this.opStr.toString()+')'
            ret = condition + " ? " + this.op1.toString() + " : " + this.op2.toString();
        }
        else if( this.isUnary ) {
            if( this.opStr === '!' ) {
                if( isBooleanOp( this.op1 ) ) { //Don't call ___boolOp if not necessary
                    ret = '!' + this.op1.toString();
                }
                else {
                    ret = '!___boolOp('+this.op1.toString()+')';
                }
            }
            else {
                ret = this.opStr.toString() + " " + this.op1.toString();
            }
        }
        else if( this.opStr === "in" ) {
            ret = '___inOperator(' + this.op2.toString() + ', '+ this.op1.toString()+')';
        }
        else {
            //Magic to make a < b < c work properly
            if( this.madeRelational ) {
                if( this.op1.op1 && this.op1.isRelational() ) {
                    this.op1.madeRelational = true;
                    ret = '___binOp("&&", '+this.op1.toString()+', ___binOp("'+ this.opStr.toString() + '",'+ this.op1.op2.toString() +', '+ this.op2.toString() + '))';
                }
                else {
                    ret = '___binOp("'+this.opStr.toString()+'",'+this.op1.toString()+','+this.op2.toString()+')';

                }

            }
            else if( this.isRelational() &&
                this.op1.op1 &&
                this.op1.isRelational() ) {
                this.op1.madeRelational = true;
                ret = '___binOp("&&", '+this.op1.toString()+', ___binOp("'+ this.opStr.toString() + '",'+ this.op1.op2.toString() +', '+ this.op2.toString() + '))';
            }
            else {
                ret = '___binOp("'+this.opStr.toString()+'",'+this.op1.toString()+','+this.op2.toString()+')';
            }
        }
        
        return ret;
    };
    
    
    return Operation;
})();

var StringLiteral = (function() {
    var method = StringLiteral.prototype;
    
    function StringLiteral( str ) {
        this.str = str;
    }
    
    method.toString = function() {
        if( !this.str ) return "";
        return this.str.replace( /[\n\r\u2028\u2029]/g, function(m){
            if( m === "\n" ) return "\\n";
            if( m === "\r" ) return "\\r";
            return "\\u" + (("0000") + m.charCodeAt(0).toString(16)).slice(-4);
        });
    };
    
    return StringLiteral;
})();

var NamedArgument = (function() {
    var method = NamedArgument.prototype;
    
    function NamedArgument( name, expr) {
        this.name = name;
        this.expr = expr;
    }
    
    method.toString = function() {
        return ( typeof this.name === "string" ? 
            '"' + this.name + '"' : 
            this.name.toString() ) + ": " + this.expr.toString();
    };
    
    return NamedArgument;
})();

var Range = (function() {
    var method = Range.prototype;
    
    var sign = function(v){
        return v === "+" || v === "-";
    }
    
    function Range( minExpr, maxExpr, stepExpr ) {
        this.minExpr = minExpr;
        this.maxExpr = maxExpr;
        this.stepExpr = stepExpr || "1";
    }
    
    return Range;
})();


var ArrayLiteral = (function() {
    var method = ArrayLiteral.prototype;
    
    function ArrayLiteral( elements ) {
        this.elements = elements;
    }
    
    method.toString = function() {
        return "[" + this.elements.toString() +"]";
        
    };
    
    return ArrayLiteral;
})();

var ForeachStatement = (function(){

    var method = ForeachStatement.prototype;
    
    var randomId = (function() {
        var id = 0;

        return function() {
            return "" + (++id);
        };
    })();
    
    function ForeachStatement( key, value, collection ) {
        this.key = key;
        this.value = value;
        this.collection = collection;
        this.body = [];
    }
    

    method.toString = function() {
        var id = randomId();
        var body = this.body.join("");
        
        //Short array iteration for @for( items ) <div>@name</div>
        if( !this.key && !this.value ) {
            var key = "___key" + randomId();
            return "    (function(___collection"+id+"){" +
            " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
            "            var count = ___collection"+id+".length;" +
            "            for( var ___i"+id+" = 0, ___len"+id+" = count; ___i"+id+" < ___len"+id+"; ++___i"+id+" ) {" +
            "                var index = ___i"+id+";" +
            "    with( ___collection"+id+"[___i"+id+"] ) { " +
                    body +
            "    }" +
            "}" +
            "    }).call(this, "+this.collection+");";
        }
        //Range iteration @for( item in | 5 -> 10| 5)
        else if( this.collection instanceof Range ) {
            var range = this.collection;
            if( this.value ) {
                this.key = this.value;
            }
            
            return "    (function(){" +
                    "var ___min"+id+" = ___ensureNumeric("+range.minExpr+"); " +
                    "var ___max"+id+" = ___ensureNumeric("+range.maxExpr+"); " +
                    "var ___step"+id+" = ___ensureNumeric("+range.stepExpr+") || 1; " +
                    
                    "if( ___min"+id+" === ___max"+id+" ) { return; }" +
                    
                    "if( ___min"+id+" > ___max"+id+" ) { " +
                    "    var count = ___min"+id+" - ___max"+id+"; " +
                    "    for( var "+this.key+" = ___min"+id+"; "+this.key+" >= ___max"+id+"; "+this.key+" -= ___step"+id+" ) { " +
                            body  +
                    "    } " +
                    "} " +
                    "else { " +
                    "    var count = ___max"+id+" - ___min"+id+"; " +
                    "    for( var "+this.key+" = ___min"+id+"; "+this.key+" <= ___max"+id+"; "+this.key+" += ___step"+id+" ) { " +
                            body  +
                    "    } " +
                    "} " +
                    "    }).call(this);";
        } 
        else if( !this.value ) { //Array iteration
            return  "    (function(___collection"+id+"){" +
                    " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
                    "            var count = ___collection"+id+".length;" +
                    "            for( var ___i"+id+" = 0, ___len"+id+" = count; ___i"+id+" < ___len"+id+"; ++___i"+id+" ) {" +
                    "                var "+this.key+" = ___collection"+id+"[___i"+id+"];" +
                    "                var index = ___i"+id+";" +
                            body +
                    "            }" +
                    "    }).call(this, "+this.collection+");";
        }
        else {  //Object/Map iteration
            return  "    (function(___collection"+id+"){" +
                    " ___collection"+id+" = ___isObject(___collection"+id+") ? ___collection"+id+" : {}; " +
                    "            for( var "+this.key+" in ___collection"+id+" ) { if( ___hasown.call( ___collection"+id+", "+this.key+") ) {" +
                    "                var "+this.value+" = ___collection"+id+"["+this.key+"];" +
                            body +
                    "            }}" +
                    "    }).call(this, "+this.collection+");";
        }
    };
    
    method.push = function() {
        this.body.push.apply( this.body, arguments );
    };
    
    
    return ForeachStatement;
})();
