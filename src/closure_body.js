//Not used directly, used to generate the string of code necessary for template functions
(function() {
    var FUNCTION = "function",
        OBJECT = "object",
        STRING = "string",
        OBJECT_ARRAY = "[object Array]",
        
        
        
        toString = Object.prototype.toString;
    
    var ___self;
    
    var ___global = Function("return this")();

    var ___trim = (function() {
        /*From es5-shim*/
        var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
            "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
            "\u2029\uFEFF";

        if( String.prototype.trim && !ws.trim()) {
            return function( str ) {
                return str.trim();
            };
        }
        else {
            ws = "[" + ws + "]";
            var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
                trimEndRegexp = new RegExp(ws + ws + "*$");
                
            return function( str ) {
                return String(str).replace(trimBeginRegexp, "").replace( trimEndRegexp, "");
            }
        }
    })();
    
    var ___ensureNumeric = function( obj ) {
        if( isFinite( obj ) ) {
            return +obj;
        }
        return 0;
    };
    
    var ___range = function( min, max ) {
        var ret = [];
    };
    
    var ___method = function( obj, methodName, args ) {
        var method;
        if( obj == null || !( method = obj[methodName] ) ) {
            return null;
        }

        if( typeof method === FUNCTION ) {
            try {
                var ret = args? method.apply(obj, args): method.call(obj);
                if( ret == null ) {
                    return null;
                }
                return ret;
            }
            catch(e) {
                return null;
            }
        }
        else {
            return null;
        }
    };
    
    var ___functionCall = function( thisp, fn, args ) {
        if( fn && typeof fn === FUNCTION ) {
            try {
                var ret = args ? fn.apply(thisp, args) : fn.call(thisp);
                if( ret == null ) {
                    return null;
                }
                return ret;
            }
            catch(e) {
                return null;
            }
        }
        return null;
    };
                
    var ___propAccess = function( obj, args ) {
        var cur = obj;

        if( cur == null ) {
            return null;
        }

        for( var i = 0; i < args.length; ++i ) {
            cur = cur[args[i]];
            if( !cur ) {
                return null;
            }
        }
        
        return cur;
    };
    
    var ___inOp = function( obj, str ) {
        var needleIsString = typeof str === STRING;
        
        if( needleIsString && typeof obj === STRING ) {
            return obj.indexOf(str) > -1;
        }
    
        if( Object(obj) !== obj ) {
            return false;
        }

        if( Array.isArray( obj ) ) {
            return obj.indexOf(str) > -1;
        }

        if( needleIsString ) {
            return false;
        }

        return ___hasown.call( obj, str );
    };
    
    var ___boolOp = function( obj ) {
        if( obj && obj.length ) {
            return obj.length > 0;
        }
        return typeof obj === FUNCTION ? false : !!obj;
    };
    
    var ___binOp = function( op, obj1, obj2 ) {
        var falsy = false;
        if( obj1 == null || obj2 == null ) {
            falsy = true;
        }
        
        if( typeof obj1 === FUNCTION || typeof obj2 === FUNCTION ) {
            falsy = true;
        }
        
        switch( op ) {
            case '/': return falsy ? 0: obj2 == 0 ? null : obj1 / obj2;
            case '%': return falsy ? 0: obj1 % obj2;
            case '*': return falsy ? 0: obj1 * obj2;
            case '+': return falsy ? 0: obj1 + obj2;
            case '-': return falsy ? 0: obj1 - obj2;
            case '==': return falsy ? false: obj1 == obj2;
            case '!=': return falsy ? false: obj1 != obj2;
            case '&&': return falsy ? null: obj1 && obj2;
            case '||': return falsy ? null: obj1 || obj2;
            case '<': return falsy ? false: obj1 < obj2;
            case '<=': return falsy ? false: obj1 <= obj2;
            case '>': return falsy ? false: obj1 > obj2;
            case '>=': return falsy ? false: obj1 >= obj2;
        }
        return null;
    };
    
    var ___hasown = Object.prototype.hasOwnProperty;
    
    var ___isArray = Array.isArray || function( obj ) {
        return !!(obj && toString.call(obj) === OBJECT_ARRAY);
    };
    
    var ___isObject = function( obj ) {
        return !!(obj && Object(obj) === obj && typeof obj === OBJECT );
    };
    
    var ___ensureArrayLike = function(obj) {
        if( !obj ) {
            return [];
        }
        
        
        if( obj.length &&
            ___hasown.call(obj, "0") && 
            typeof obj !== FUNCTION &&
            ___hasown.call(obj, obj.length -1 ) ) {
            return obj;
        }

        return [];
    };
    
    var ___Safe = (function() {
        var method = ___Safe.prototype;
        
        function ___Safe(string, safeFor) {
            this.string = string;
            this.safeFor = safeFor;
        }
        
        method.toString = function() {
            return this.string;
        };
        
        return ___Safe;
    })();


    var ___safeString__ = (function(){
        
        
        var counts = {
            2: "00",
            4: "0000",
            6: "000000"
        };
        
        var pad = function(str, count) {
            if( str.length >= count ) {
                return str;
            }
            return ((counts[count]) + str).slice(-count);
        };
        
        var rurlstart = /^(?:http|https|ftp):\/\//;

        var rhtmlencode = /[&<>]/g,
        
            rattrencode = /['"]/g,
            
            rjsencode = /[\u0000-\u001F\u007f-\u00A0\u2028\u2029&<>'"\\\/]+/g,
            
            rcssencode = /[^._,!#%\-a-zA-Z0-9\u00A1-\uFFFF]+/g,

            htmlEncodeTable = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;"
            },
            
            attrEncodeTable = {
                '"': "&quot;",
                "'": "&#39;"
            },

            replacerHtmlEncode = function( m ) {
                return htmlEncodeTable[m];
            },

            replacerAttrEncode = function( m ) {
                return attrEncodeTable[m];
            },
            
            replacerCssEncode = function( m ) {
                var ret = "";
                
                for( var i = 0; i < m.length; ++i ) {
                    ret += ( "\\" + pad( m.charCodeAt( i ).toString( 16 ), 6 ) );
                }
                
                return ret;
            },

            replacerJsEncode = function( m ) {
                var ret = "";
                
                for( var i = 0; i < m.length; ++i ) {
                    var charCode = m.charCodeAt( i );
                    if( charCode <= 0xFF ) {
                        ret += ("\\x" + pad( charCode.toString( 16 ), 2 ) );
                    }
                    else {
                        ret += ("\\u" + pad( charCode.toString( 16 ), 4 ) );
                    }
                    
                }
                
                return ret;
            };

        var NO_ESCAPE = function( str ) {
                return str == null ? "" : ("" + str);
            },
            
            CSS = function( str ) {
                str = "" + str;
                return str.replace(rcssencode, replacerCssEncode);
            },

            HTML = function( str ) {
                str = "" + str;
                return str.replace(rhtmlencode, replacerHtmlEncode);
            },

            ATTR = function( str ) {
                str = "" + str;
                return str.replace(rattrencode, replacerAttrEncode);
            },

            URI = function( str ) {
                str = "" + str;
                var scheme;
                if( rurlstart.test(str)) {
                    return ATTR(encodeURI(str));
                }
                return "#";
            },

            URI_PARAM = function( str ) {
                str = "" + str;
                return ATTR(encodeURIComponent(str));
            },
            
            SCRIPT = function( obj ) {
                if( obj == null || typeof obj == FUNCTION) {
                    obj = null;
                }
                return "JSON.parse('" +JSON.stringify(obj).replace(rjsencode, replacerJsEncode) + "')";
            },

            SCRIPT_IN_ATTR = function( obj ) {
                return ATTR(SCRIPT(obj));
            };
        
        var escapes = {
            NO_ESCAPE: NO_ESCAPE,
            HTML: HTML,
            ATTR: ATTR,
            SCRIPT: SCRIPT,
            SCRIPT_IN_ATTR: SCRIPT_IN_ATTR,
            URI: URI,
            URI_PARAM: URI_PARAM,
            CSS: CSS
        };

        return function( string, escapeFn ) {
        
            if( escapeFn !== "SCRIPT" &&
                escapeFn !== "SCRIPT_IN_ATTR" ) {
                
                if( (string == null || typeof string === FUNCTION) ) {
                    return escapeFn === "URI" ? "#" : "";
                }
                else if( string instanceof ___Safe ) { /*wat*/
                    if( string.safeFor === escapeFn ) {
                        return string;
                    }
                    else {
                        return escapes[escapeFn](string.string);
                    }
                }
                else if( ___isArray( string ) ) {
                    var ret = [];
                    for ( var i = 0; i < string.length; ++i ) {
                        ret.push(___safeString__(string[i], escapeFn));
                    }
                    return ret.join("");
                }
            }

            return escapes[escapeFn](string);
        };
    })();
}).toString().replace(/^\s*\(?\s*\(?\s*function\s*\(\)\s*\{/, '').replace(/\}\s*\)?\s*$/, '');