var Runtime = (function() {
    var method = Runtime.prototype,
        version = "@VERSION";

    var FUNCTION = "function",
        OBJECT = "object",
        STRING = "string",
        OBJECT_ARRAY = "[object Array]",
        toString = Object.prototype.toString;
        
    function isFunctionNative(f) {
        return /^\s*function\s*(\b[a-z$_][a-z0-9$_]*\b)*\s*\((|([a-z$_][a-z0-9$_]*)(\s*,[a-z$_][a-z0-9$_]*)*)\)\s*{\s*\[native code\]\s*}\s*$/i.test(String(f));
    }
    
    function parseVersion( versionString ) {
    
        if( typeof versionString !== STRING ) {
            throw new Error( "Invalid version string: '"+versionString+"'.");
        }
    
        var split = versionString.split(".");
        if( split.length !== 3 ) {
            throw new Error( "Invalid version string: '"+versionString+"'.");
        }
        return [
            +split[0],
            +split[1],
            +split[2]
        ];
    }
    
    function compareVersion( a, b ) {
        if( a.join(".") === b.join(".") ) {
            return 0;
        }
        
        if( a[0] < b[0] ) {
            return 1;
        }
        else if( a[0] > b[0] ) {
            return -1;
        }
        
        if( a[1] < b[1] ) {
            return 1;
        }
        else if( a[1] > b[1] ) {
            return -1;
        }
        
        if( a[2] < b[2] ) {
            return 1;
        }
        else {
            return -1;
        }
        
    }
    
    function checkVersion( a, b ) {
        a = parseVersion( a );
        b = parseVersion( b );
        var cmp = compareVersion( a, b );
        
        if( cmp !== 0 ) {
            throw new Error( "Version mismatch. Compiler version: " + a.join(".")  + " Runtime version: " + b.join(".") + "\n" +
            (cmp === 1 ? "The runtime version is newer than the version of the compiler the template was compiled with. "+
                "Please recompile with appropriate compiler version." : 
                "The runtime version is older than the version of the compiler the template was compiled with. "+
                "Please use the appropriate runtime version."   ) );
        }
        
        return true;
    };
    
    //Minimize code inside try-catch to avoid bailouts on V8
    var tryCallFunction = function( ctx, fn, args ) {
        try {
            return args ? fn.apply(ctx, args) : fn.call(ctx);
        }
        catch( e ) {
            return null;
        }
    }
    
    //TODO use sandboxing
    function Runtime( compilerVersion ) {
        checkVersion( compilerVersion, version );
        this.callContext = null;
    }
    

    method.checkVersion = function( ver ) {
        return checkVersion( ver, version );
    };
    
    method.trim = (function() {
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
    
    var indexOf = (function() {
        if( Array.prototype.indexOf ) {
            return function( obj, prop ) {
                return obj.indexOf(prop);
            }
        }
        else {
            return function( obj, prop ) {
                for( var i = 0, l = obj.length; i < l; ++i ) {
                    if( obj[i] === prop ) {
                        return i;
                    }
                }
                
                return -1;
            }
        }
    })();
    
    method.contextParser = function() {
        return new HtmlContextParser().disableErrors();
    };
    
    method.ensureNumeric = function( obj ) {
        if( isFinite( obj ) ) {
            return +obj;
        }
        return 0;
    };

    method.setCallContext = function( obj ) {
        this.callContext = obj;
    };
    

    method.method = function( obj, methodName, args ) {

        if( obj == null || methodName === "__proto__") {
            return null;
        }


        var method = obj[methodName],
            isFunc = typeof method === FUNCTION;

        if( !isFunc ) {
            var type = "___" + toType(obj);
            
            if( ( ( method = extensions.get(type)) && (method = method.get(methodName)) ) ) {
                return tryCallFunction( obj, method, args);
            }
            else {
                return null;
            }
        }
        else {
            return tryCallFunction( obj, method, args );
        }
    };

    
    method.safeMethod = function( obj, methodName, args ) {

        if( obj == null || methodName === "__proto__") {
            return null;
        }
        

        var method = obj[methodName];
        
        if( isFunctionNative( method ) ) {
            var type = "___" + toType(obj),
                typeMap = extensions.get(type);
                
            if( !typeMap ) {
                throw new Error( "Unqualified use of a native method.");
            }
            method = typeMap.get( methodName );
            
            if( !method ) {
                throw new Error( "Unqualified use of a native method.");
            }
            return tryCallFunction( obj, method, args);
        }
        else if( typeof method === FUNCTION ) {
            return tryCallFunction( obj, method, args);
        }
        else {
            return null;
        }
    };

    method.Object = {}.constructor;
    
    
    
    method.functionCall = function( thisp, fn, args ) {
        if( fn && typeof fn === FUNCTION ) {
            return tryCallFunction( thisp, fn, args );
        }
        return null;
    };
    
    method.inOp = function( obj, str ) {
        var needleIsString = typeof str === STRING;
        
        if( needleIsString && typeof obj === STRING ) {
            return obj.indexOf(str) > -1;
        }
    
        if( Object(obj) !== obj ) {
            return false;
        }

        if( this.isArray( obj ) ) {
            return indexOf(obj, str) > -1;
        }

        return ___hasown.call( obj, str );
    };
    
    method.hasown = Object.prototype.hasOwnProperty;
    
    method.isArray = Array.isArray || function( obj ) {
        return !!(obj && toString.call(obj) === OBJECT_ARRAY);
    };
    
    method.isObject = function( obj ) {
        return !!(obj && Object(obj) === obj && typeof obj === OBJECT );
    };
    
    method.ensureArrayLike = function(obj) {
        if( this.isArray( obj ) && isFinite(obj.length) ) {
            return obj;
        }
        
        return [];
    };
    
    method.Safe = (function() {
        var method = Safe.prototype;
        
        function Safe(string, safeFor) {
            this.string = string;
            this.safeFor = safeFor;
        }
        
        method.toString = function() {
            return this.string;
        };
        
        return Safe;
    })();
    
    
    method.safeString = (function() {
        var context = HtmlContextParser.context;
        
        var NO_ESCAPE = context.NO_ESCAPE.name,
            HTML = context.HTML.name,
            ATTR = context.ATTR.name,
            ATTR_NAME = context.ATTR_NAME.name,
            URI = context.URI.name,
            URI_PARAM = context.URI_PARAM.name,
            SCRIPT = context.SCRIPT.name,
            SCRIPT_IN_ATTR = context.SCRIPT_IN_ATTR.name,
            CSS = context.CSS.name,
            HTML_COMMENT = context.HTML_COMMENT.name,
            SCRIPT_IN_URI_PARAM_ATTR = context.SCRIPT_IN_URI_PARAM_ATTR.name,
            escapes = {};

        /*Todo use htmlcontextparser = no duplication*/
        var uriAttr = /^(?:src|lowsrc|dynsrc|longdesc|usemap|href|codebase|classid|cite|archive|background|poster|action|formaction|data)$/;
        /*Todo use htmlcontextparser */
        var getAttrEscapeFunction = function( attrName ) {
            attrName = escapeForAttrName(attrName).toLowerCase();
            
            if( uriAttr.test( attrName ) ) {
                return URI;
            }
            else if( attrName === "style" ) {
                return CSS;
            }
            else if( attrName.charAt(0) === "o" && attrName.charAt(1) === "n" ) {
                return SCRIPT_IN_ATTR;
            }
            else {
                return ATTR;
            }
        };
        
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

        var htmlControls = {},
            rhtmlcontrol,
            ranges = [[0x00,0x19], [0x7F, 0x9F]],
            replacerHtmlControl = function( m ) {
                return htmlControls[m];
            };
            
        for( var i = 0; i < ranges.length; ++i ) {
            for( var c = ranges[i][0]; c <= ranges[i][1]; ++c ) {
                var character = String.fromCharCode(c);
                htmlControls[character] = "&#FFFD;";
            }
            ranges[i] = "\\u" + pad(ranges[i][0].toString(16), 4) + "-" + "\\u" + pad(ranges[i][1].toString(16), 4)
        };
        
        htmlControls[String.fromCharCode(0xA0)] = "&nbsp;";
        ranges.push( "\\u00A0" );
        
        rhtmlcontrol = new RegExp( "[" + ranges.join("") + "]", "g");
        
        var htmlControlEncode = function( str ) {
            return str.replace( rhtmlcontrol, replacerHtmlControl );
        };
        
        var rurlstart = /^(?:http|https|ftp):\/\//;

        var rhtmlencode = /[&<>]/g,
        
            rattrname = /[^a-zA-Z0-9_:-]+/g,
            
            rhtmlcomment = /--/g,
        
            rattrencode = /['"&]/g,
            
            rjsencode = /[\u0000-\u001F\u007f-\u00A0\u2028\u2029&<>'"\\\/\]\[]+/g,
            
            rcssencode = /[^._,!#%\-a-zA-Z0-9\u00A1-\uFFFF]+/g,

            htmlEncodeTable = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;"
            },
            
            attrEncodeTable = {
                '"': "&quot;",
                "'": "&#39;",
                "&": "&amp;"
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
            
        
        var coerceValueToString = function( obj ) {
            return ((!obj && obj !== 0) || (typeof str === FUNCTION)) ? "" : "" + obj;
        };
        
        var tryJSONStringify = function( obj ) {
            var ret = null;
            try {
                ret = JSON.stringify(obj);
            }
            catch( e ) {
                ret = null;
            }
            return ret;
        };
        
        var encodeUriComponent = (function(){
            var radditional = /[!'()*]/g,
                map = {
                    "!": "%21",
                    "'": "%27",
                    "(": "%28",
                    ")": "%29",
                    "*": "%2A"
                },
                radditionalesc = function( m ) {
                    return map[m];
                };
        
            return function( str ) {
                return encodeURIComponent(str).replace(radditional, radditionalesc);
            };
            
        })();

        var encodeUri = (function(){
            var rvalidscheme = /^(?:https|http|mailto|ftps|ftp)$/,
                rextractscheme = /^([^:]*):/;
            
            
            return function( str ) {
                var scheme = rextractscheme.exec(str);
                
                if( !scheme ) {
                    return str;
                }
                else {
                    if( !rvalidscheme.test( scheme[1] ) ) {
                        return "#";
                    }
                    else {
                        return str;
                    }
                }
            };
        
        })();
                     
        var escapeForNothing = function( str ) {
                return str;
            },
            
            escapeForHtmlComment = function( str ) {
                str = "" + str;
                return htmlControlEncode(str.replace( rhtmlcomment, '&#45;&#45;' ));
            },
            
            escapeForAttrName = function( str ) {
                str = coerceValueToString(str).replace( rattrname, "");
                if( !str ) {
                    return "data-empty-attribute";
                }
                return str;
            },
            
            escapeForCss = function( str ) {
                return str.replace(rcssencode, replacerCssEncode);
            },

            escapeForHtml = function( str ) {
                return htmlControlEncode(str.replace(rhtmlencode, replacerHtmlEncode));
            },

            escapeForAttr = function( str ) {
                return htmlControlEncode(str.replace(rattrencode, replacerAttrEncode));
            },

            escapeForUri = function( str ) {
                return escapeForAttr(encodeUri(str));
            },
            
            /*TODO: does attribute escaping too although not necessary in style tags*/
            escapeForUriParam = function( str ) {
                return escapeForAttr(encodeUriComponent(str));
            },
            
            escapeForScript = function( obj ) {
                if( obj == null || typeof obj == FUNCTION) {
                    obj = null;
                }

                var ret = tryJSONStringify(obj);

                if( !ret ) {
                    return "JSON.parse('null');";
                }
                return "JSON.parse('" +ret.replace(rjsencode, replacerJsEncode) + "')";
            },
            
            escapeForScriptInUriParamAttr = function( obj ) {
                return escapeForUriParam(escapeForScript(obj));
            },

            escapeForScriptInAttr = function( obj ) {
                return escapeForAttr(escapeForScript(obj));
            };
                    
        escapes[NO_ESCAPE] = escapeForNothing;
        escapes[HTML] = escapeForHtml;
        escapes[ATTR] = escapeForAttr;
        escapes[ATTR_NAME] = escapeForAttrName;
        escapes[URI] = escapeForUri;
        escapes[URI_PARAM] = escapeForUriParam;
        escapes[SCRIPT] = escapeForScript;
        escapes[SCRIPT_IN_ATTR] = escapeForScriptInAttr;
        escapes[CSS] = escapeForCss;
        escapes[HTML_COMMENT] = escapeForHtmlComment;
        escapes[SCRIPT_IN_URI_PARAM_ATTR] = escapeForScriptInUriParamAttr;
        
        
        var passedAsIs = SCRIPT | SCRIPT_IN_ATTR | SCRIPT_IN_URI_PARAM_ATTR | ATTR_NAME;

        return function( string, escapeFn ) {
            var passAsIs = (escapeFn & passedAsIs) > 0;
        
            if( !passAsIs && this.isArray( string ) ) {
                //Convert arrays to a string by joining them
                if( string.length ) {
                    if( string[0] instanceof this.Safe ) { //Assumption: If one item in an array is a Safe - others are too
                        var r = [],
                            safeFor = string[0].safeFor;
                        
                        for( var i = 0, l = string.length; i < l; ++i ) {
                            r.push( string[i].string );
                        }
                        string = new this.Safe( r.join(""), safeFor );
                    }
                    else {
                        string = string.join("");
                    }
                }
                else {
                    string = "";
                }
            }
        
            if( typeof escapeFn == STRING ) {                
                escapeFn = getAttrEscapeFunction( escapeFn );
                return this.safeString( string, escapeFn );                
            }
            
            if( string instanceof this.Safe ) { /*wat, TODO: account for raw*/
                if( string.safeFor !== escapeFn ) {
                    string.string = escapes[escapeFn](string.string);
                    string.safeFor = escapeFn;
                    return string;
                }        
                return string.string;
            }
        
            if( !passAsIs ) {
                string = coerceValueToString(string);
                
                if( !string ) {
                    return (escapeFn === URI ? "#" : "");
                }
            }

            return escapes[escapeFn](string);
        };
    })();
    
    var extensions = new Map();
    extensions.setAll({
        ___Array: new Map(),
        ___String: new Map(),
        ___Number: new Map(),
        ___Boolean: new Map(),
        ___Object: new Map(),
        ___RegExp: new Map(),
        ___Date: new Map(),
        Math: Math,
        Date: Date
    });
    
    
    method.___getExtensions = function() {
        return extensions;
    };
    
    var ___isObject = method.isObject,
        ___hasown = method.hasown;
    
    Runtime.registerExtensions = function( obj ) {
        if( !___isObject( arr ) ) {
            throw new Error( "Expecting object, got '" +(obj+"").substr(0,100) + "'.");
        }
        
        for( var key in obj ) {
            if( ___hasown.call( obj, key ) ) {
                Runtime.registerExtension( key, obj[key] );
            }
        }
    };
    
    var toType = function(obj) {
        return toString.call(obj).slice(8, -1);
    };

    var rinvalidname = /^___/;

    Runtime.registerExtension = function( name, value ) {
        var split;
        if( !___isObject(value) && typeof value !== FUNCTION ) {
            throw new Error("Can only register functions or objects as extensions");
        }
        if( rinvalidname.test(name) ) {
            throw new Error("Names starting with ___ are reserved for internal use");
        }
        if( name === "__proto__" ) {
            throw new Error("Cannot use __proto__ as a name");
        }
        if( ( split = name.split(".") ).length > 1 ) {
            if( typeof value !== FUNCTION ) {
                throw new Error( "Methods must be of function type");
            }
            var typeMap = "___" + split[0];
            if( !extensions.has( typeMap ) ) {
                extensions.set( typeMap, new Map() );
            }
            extensions.get( typeMap ).set( split[1], value );
        }
        else {
            extensions.set(name, value);
        }
    };
    

    var makePropAccess = function( count ) {
        var params = ["obj"];
        for( var i = 0; i < count; ++i ) {
            params.push( "$" + i );
        }
        var body = "";
        body += "return function("+params.join(",")+") {";
        body += "if( !obj ) return null; var cur = obj; ";
        
        for( var i = 0; i < count-1; ++i ) {
            body += "if( hasown.call(cur, $"+i+") ) { cur = cur[$"+i+"];";
        }
        body += "if( hasown.call(cur, $"+i+") ) {return cur[$"+i+"];";
        
        for( var i = 0; i < count; ++i ) {
            body += "}";
        }
        
        body += "return null;};";
        
        return new Function("hasown", body)(___hasown);
    };
    
    for( var i = 0; i < 5; ++i ) {
        method["propAccess$"+(i+1)] = makePropAccess(i+1);
    }
    
    return Runtime;
})();

