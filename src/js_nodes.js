var Snippet = (function() {
    var method = Snippet.prototype;
    
    function Snippet( expr ) {
        this.expr = expr;


    }
    
    method.getExpression = function() {
        return this.expr;
    };
    
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
            last;
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






var Block = (function() {
    var method = Block.prototype;
    
    function Block() {
        this.statements = [];
    }
    
    method.push = function( statement ) {
        this.statements.push( statement );
    };
    
    method.toString = function() {
        var ret = [];
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        return ret.join("");
    };
    
    method.getStatements = function() {
        return this.statements;
    };
    
    return Block;
})();

//A block that has a header like @if( header ) { blockCode }
var HeaderBlock = (function() {
    var _super = Block.prototype,
        method = HeaderBlock.prototype = Object.create(_super);
    
    method.constructor = HeaderBlock;
    
    function HeaderBlock( header ) {
        _super.constructor.apply(this, arguments);
        this.header = header;
    }
    
    method.toString = function() {
        return this.getName() + " ( " + this.header + " )  { " + _super.toString.call(this) + "}";
    };
        
    return HeaderBlock;
})();

//A block that has its own variable scope
var ScopedBlock = (function() {
    var _super = Block.prototype,
        method = ScopedBlock.prototype = Object.create(_super);
    
    method.constructor = ScopedBlock;
    
    function ScopedBlock() {
        _super.constructor.apply(this, arguments);
        this.helpers = [];
        this.variables = {};
    }

    method.setHelpers = function( helpers ) {
        this.helpers = helpers;  
    };

    method.getHelpers = function() {
        return this.helpers;
    };
    
    method.getName = function() {
        return null;
    };
    
    method.mergeVariables = function( varsSet ) {
        for( var key in varsSet ) { 
            if( varsSet.hasOwnProperty( key ) ) {
                this.variables[key] = true;
            } 
        }
    };
    
    method.shouldCheckDataArgument = function() {
        return false;
    };
    
    method.shouldDeclareGlobalsSeparately = function() {
        return true;
    };
    
    method.getVariables = function() {
        return this.variables;
    };
    
    method.establishReferences = function( globalReferences, scopedReferences ) {
        var helperNames = {},
            helpers = this.helpers,
            vars = this.getVariables(),
            possibleGlobal,
            shouldCheckDataArgument = this.shouldCheckDataArgument(),
            shouldDeclareGlobalsSeparately = this.shouldDeclareGlobalsSeparately();
            hLen = helpers.length;

        for( var i = 0; i < hLen; ++i ) {
            helperNames[helpers[i].getName()] = true;
        }

        for( var key in vars ) {
            if( vars.hasOwnProperty( key ) && //Don't override helpers
                !helperNames.hasOwnProperty( key ) ) {
                
                
                if( ( possibleGlobal = globalsAvailable.hasOwnProperty(key) ) ) {
                    if( !shouldDeclareGlobalsSeparately ) {
                        if( shouldCheckDataArgument ) {
                            scopedReferences.push(key + " = (___hasown.call(___data, '"+key+"' ) ? ___data."+key+":"+
                                    "___hasown.call(this, '"+key+"' ) ? this."+key+" : ___global." + key);
                        }
                        else {
                            scopedReferences.push(key + " = this."+key+" || (___hasown.call(this, '"+key+"' ) ? this."+key+" : ___global." + key + ")");
                        }
                        continue;
                    }
                    else {
                        globalReferences.push("____"+key + " = ___global." + key);
                    }
                }
                
                if( shouldCheckDataArgument ) {
                    scopedReferences.push(key + " = (___hasown.call(___data, '"+key+"' ) ? ___data."+key+":"+
                                    "___hasown.call(this, '"+key+"' ) ? this."+key+":"+
                    ( possibleGlobal ? "____"+key : 'null') + ")");
                }
                else {
                    scopedReferences.push(key + " = this."+key+" || (___hasown.call(this, '"+key+"' ) ? this."+key+" :"+
                    ( possibleGlobal ? "____"+key : 'null') + ")");
                
                }              
             }
        }

    };
    
    return ScopedBlock;
})();


var ForeachBlock = (function() {
    var _super = Block.prototype,
        method = ForeachBlock.prototype = Object.create(_super);

    var randomId = (function() {
        var id = 0;

        return function() {
            return "" + (++id);
        };
    })();
   
    method.constructor = ForeachBlock;
    
    function ForeachBlock( key, value, collection ) {
        _super.constructor.apply(this, arguments);
        this.key = key;
        this.value = value;
        this.collection = collection;
    }

    method.toString = function() {
        var id = randomId();
        var body = _super.toString.call( this );
        
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
   
    return ForeachBlock;
})();


var HelperBlock = (function() {
    var _super = ScopedBlock.prototype,
        method = HelperBlock.prototype = Object.create(_super);
    
    method.constructor = HelperBlock;
    
    function HelperBlock( name, parameterNames ) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.parameterNames = parameterNames;
        
    }
  
    method.shouldCheckDataArgument = function() {
        return false;
    };

    method.shouldDeclareGlobalsSeparately = function() {
        return false;
    };
    
    //No need to merge the variabls that are declared in parameters
    //Globals and other helper names cannot be known at this time
    method.mergeVariables = function( varsSet ) {
        var vars = this.getVariables();
        
        for( var key in varsSet ) {
            if( varsSet.hasOwnProperty( key ) &&
                this.parameterNames.indexOf( key ) < 0 ) {
                vars[key] = true;
            }
        }
    };
    
    method.toString = function() {
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
        
      
        this.establishReferences( globalReferences, scopedReferences );
        
        ret.push( "var " + this.name + " = function("+this.parameterNames.join(", ")+"){ " );
        
                
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }

        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( "var ___html = [];" );
        
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        
        ret.push( "return new ___Safe(___html.join(''), 'HTML'); };" );
        
        return ret.join( "" );
    };
    
    method.getParameterNames = function() {
        return this.parameterNames;
    };
    
    method.getName = function() {
        return this.name;
    };
    
    return HelperBlock;
})();

var IfElseBlock = (function() {
    var _super = HeaderBlock.prototype,
        method = IfElseBlock.prototype = Object.create(_super);
    
    method.constructor = IfElseBlock;
    
    function IfElseBlock() {
        _super.constructor.apply(this, arguments);
    }
    
    method.getName = function() {
        return "else if";
    }
    
    return IfElseBlock;
})();

var IfBlock = (function() {
    var _super = HeaderBlock.prototype,
        method = IfBlock.prototype = Object.create(_super);
    
    method.constructor = IfBlock;
    
    function IfBlock() {
        _super.constructor.apply(this, arguments);
    }

    method.getName = function() {
        return "if";
    }
    
    return IfBlock;
})();

var ElseBlock = (function() {
    var _super = Block.prototype,
        method = ElseBlock.prototype = Object.create(_super);
    
    method.constructor = ElseBlock;
    
    function ElseBlock() {
        _super.constructor.apply(this, arguments);
    }
    
    method.toString = function() {
        return "else { " + _super.toString.call( this ) + " } ";
    };
    
    return ElseBlock;
})();

var TemplateExpression = (function() {
    var method = TemplateExpression.prototype;
    
    function TemplateExpression( expression, contextEscapeFn, escapeFn ) {
        this.expression = expression;
        this.contextEscapeFn = contextEscapeFn; //The escape function as inferred from html context for this expression
        this.escapeFn = escapeFn; //The custom escape function
    }
    
    method.toString = function() {
        var escapeFn = this.escapeFn ? this.escapeFn : this.contextEscapeFn;
        return "___html.push(___safeString__((" + this.expression.toString()+"), '"+escapeFn+"'));";
    };
    
    return TemplateExpression;
})();

var LiteralExpression = (function() {
    var method = LiteralExpression.prototype;
    
    function LiteralExpression( literal ) {
        this.literal = literal;
    }
    
    method.toString = function() {
                //Make it safe to embed in a javascript string literal
       var ret = this.literal.replace( rescapequote, "\\$1" ).replace( rlineterminator, lineterminatorReplacer );
       return "___html.push('" + ret +"');"
    };
    
    return LiteralExpression;
})();


var LiteralJavascriptBlock = (function() {
    var method = LiteralJavascriptBlock.prototype;
    
    function LiteralJavascriptBlock( code ) {
        this.code = code;
    }
    
    method.toString = function() {
        return this.code.toString();
    };
    
    return LiteralJavascriptBlock;
})();


var Program = (function() {
    var _super = ScopedBlock.prototype,
        method = Program.prototype = Object.create(_super);
    
    method.constructor = Program;
    
    var idName = "___template___";
    
    function Program() {
        _super.constructor.apply(this, arguments);
        this.helperName = null;
    }
    
    method.getName = function() {
        return this.helperName;
    };
    
    method.shouldCheckDataArgument = function() {
        return !!this.helperName;
    };
    
    method.asHelper = function( name ) {
        var ret = new Program();
        for( var key in this ) {
            if( this.hasOwnProperty( key ) ) {
                ret[key] = this[key];
            }
        }
        ret.helperName = name;
        return ret;
    };
    

    method.toHelperString = function() {
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
        
        this.establishReferences( globalReferences, scopedReferences );

        ret.push( "var "+this.helperName+" = (function() {" );
        
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }

        
        ret.push( this.getHelperCode() );
        
        ret.push( "function "+idName+"( ___data ) { ___data = ___data || {}; var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return new ___Safe(___html.join(''), 'HTML'); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(this, data); }; })();");
        
        return ret.join("");
    };
    
    method.getHelperCode = function() {
        var ret = [];
        for( var i = 0; i < this.helpers.length; ++i ) {
            ret.push( this.helpers[i].toString() );
        }
        return ret.join("");
    };
    
    method.getCode = function() {
        var ret = [];
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        return ret.join("");
    };
    
    method.toString = function() {
        if( this.helperName ) {
            return this.toHelperString();            
        }
        
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
                
        this.establishReferences( globalReferences, scopedReferences );
        
        ret.push( programInitBody );
                
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }
        
        ret.push( this.getHelperCode() );
        
        ret.push( "function "+idName+"() { var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return ___html.join(''); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(data); }; ");
        
        return ret.join("");
    };
    
    return Program;
})();

var LoopStatement = (function() {
    var method = LoopStatement.prototype;
    
    function LoopStatement( statement ) {
        this.statement = statement;
    }
    
    method.toString = function() {
        return this.statement + ";";
    };
    
    return LoopStatement;
})();


