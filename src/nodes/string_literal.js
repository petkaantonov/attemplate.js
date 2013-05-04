var StringLiteral = TemplateExpressionParser.yy.StringLiteral = (function() {
    var _super = ProgramElement.prototype,
        method = StringLiteral.prototype = Object.create(_super);
    
    method.constructor = StringLiteral;
    
    var rhex2 = /^[a-fA-F0-9]{2}$/,
    
        rhex4 = /^[a-fA-F0-9]{4}$/,
        
        rjsstring = /[\n\r\u2028\u2029\\"]/g,
        
        jsstringreplacer = function(m){
            switch( m ) {
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\\": return "\\\\";
                case '"': return '\\"';
                default: return "\\u" + (("0000") + m.charCodeAt(0).toString(16)).slice(-4);
            }
        };
    
    //TODO check where this is launched from
    function StringLiteral( str, nointerpret ) {
        _super.constructor.apply(this, arguments);
        this.str = nointerpret ? str : this.interpretString(str);
        this.stringCached = null;
    }
    //Interpret strings that have been passed directly from source
    method.interpretString = function( str ) {
        var i = 1,
            l = str.length - 1,
            ret = "",
            quote = str.charAt(0),
            escaping = false;
        
        for( ; i < l; ++i ) {
            var ch = str.charAt(i);
            if( escaping ) {
                escaping = false;
                switch( ch ) {
                    case "b": ret += "\x08"; break;
                    case "f": ret += "\x0C"; break;
                    case "n": ret += "\x0A"; break;
                    case "r": ret += "\x0D"; break;
                    case "t": ret += "\x09"; break;
                    case "v": ret += "\x0B"; break;
                    
                    case "x":
                        if( l - i < 3 ) {
                            this.setStartIndex( this.startIndex + i ).raiseError( "Invalid hex escape: \\"+str.substr(i, l-i)+". Exactly 2 hexadecimal digits required." );
                        }
                        var hex = str.substr(i+1, 2);
                        if( !rhex2.test( hex ) ) {
                            this.setStartIndex( this.startIndex + i ).raiseError( "Invalid unicode escape: \\x"+hex+". Exactly 2 hexadecimal digits required." );
                        }
                        i += 2;
                        ret += String.fromCharCode(parseInt(hex, 16));
                    break;
                    
                    case "u":
                        if( l - i < 5 ) {
                            this.setStartIndex( this.startIndex + i ).raiseError( "Invalid unicode escape: \\"+str.substr(i, l-i)+". Exactly 4 hexadecimal digits required." );
                        }
                        var hex = str.substr(i+1, 4);
                        if( !rhex4.test( hex ) ) {
                            this.setStartIndex( this.startIndex + i ).raiseError( "Invalid unicode escape: \\u"+hex+". Exactly 4 hexadecimal digits required." );
                        }
                        i += 4;
                        ret += String.fromCharCode(parseInt(hex, 16));
                    break;
                    
                    default:
                        ret += ch;
                    break;
                    
                
                }
                continue;
            }
            
            if( ch === "\\" ) {
                escaping = true;
            }
            else if( ch === quote ) {
                this.setStartIndex( this.startIndex + i ).raiseError( "Prematurely terminated string literal." );
            }
            else {
                ret += ch;   
            }
        }
        
        return ret;
    };
    
    method.accessStringStatically = function( index ) {
        var indexStr = index.toStringQuoted();
        if( indexStr === '"length"' ) {
            //Length of array literal
            //is always statically known
            return new NumericLiteral( this.str.length );
        }
        
        var num = +(indexStr.slice(1, -1));
        
        //Integer index
        if( (num | 0) === num ) {
            var len = this.str.length;
            
            if( num < 0 || num >= len ) {
                return NullLiteral.INSTANCE;
            }
            else {
                return StringLiteral.fromRaw(this.str.charAt(num));
            }
        }
        else {
            //Accessing named string props (or floating point indices) other than length - results in undefined
            return NullLiteral.INSTANCE;
        }
    };
    
    method.memberAccessible = function() {
        return true;
    };
    
    method.checkValidForFunctionCall = function() {
        this.raiseError("Cannot call string as a function");
    };
    
    method.getStaticCoercionType = function() {
        return "string";
    };
    
    method.truthy = function() {
        return this.str.length > 0;
    };
    
    method.isStatic = function() {
        return true;
    };
    
    method.toStringQuoted = function() {
        return this.toString();
    };
    
    method.toString = function() {
        if( !this.str ) return '""';
        if( this.stringCached ) {
            return this.stringCached;
        }
        return ( this.stringCached = ('"' + this.str.replace( rjsstring, jsstringreplacer) + '"') );
    };
    
    //String that doesn't need interpretation
    StringLiteral.fromRaw = function( str ) {
        return new StringLiteral(str, true);
    };
    
    StringLiteral.EMPTY = StringLiteral.fromRaw("");
    StringLiteral.EMPTY.stringCached = '""';
    
    return StringLiteral;
})();