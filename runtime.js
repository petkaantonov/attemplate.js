/**
 * @preserve Copyright (c) 2012 Petka Antonov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
;(function(global) {
    "use strict";var Runtime = (function() {
    var method = Runtime.prototype,
        version = "0.2.0";

    var FUNCTION = "function",
        OBJECT = "object",
        STRING = "string",
        OBJECT_ARRAY = "[object Array]",
        toString = Object.prototype.toString;
        
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
    

    function Runtime( compilerVersion ) {
        checkVersion( compilerVersion, version );
    }
    
    method.checkVersion = function( ver ) {
        return checkVersion( ver, version );
    };
    
    var ___trim = method.trim = (function() {
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
    
    var ___ensureNumeric = method.ensureNumeric = function( obj ) {
        if( isFinite( obj ) ) {
            return +obj;
        }
        return 0;
    };
    
    var ___method = method.method = (function() {
        
        var rnocallforarray = /^(?:join|toString|toLocaleString)$/;
        
        return function( obj, methodName, args ) {

            var method;
            if( obj == null ) {
                return null;
            }

            method = obj[methodName];
            
            if( !method || typeof method !== FUNCTION ) {
                var type = "___" + toType(obj);
                if( ( method = extensions[type][methodName] ) ) {
                    try {
                        return args? method.apply(obj, args): method.call(obj);
                    }
                    catch(e) {
                        return e.toString() + ("stack" in e ? e.stack : "");
                    }
                }
                else {
                    return null;
                }
            }
            else {
 
                /*Calling these functions on array screws up auto escaping for them*/
                if( ___isArray( obj ) && rnocallforarray.test( methodName ) ) {
                    return obj;
                }
            
                try {
                    return args? method.apply(obj, args): method.call(obj);
                }
                catch(e) {
                    return e.toString() + ("stack" in e ? e.stack : "");
                }
            }
        };
    })();
    
    var ___functionCall = method.functionCall = function( thisp, fn, args ) {
        if( fn && typeof fn === FUNCTION ) {
            try {
                var ret = args ? fn.apply(thisp, args) : fn.call(thisp);
                if( ret == null ) {
                    return null;
                }
                return ret;
            }
            catch(e) {
                return e.toString()  + ("stack" in e ? e.stack : "");;
            }
        }
        return null;
    };
    
    var ___inOp = method.inOp = function( obj, str ) {
        var needleIsString = typeof str === STRING;
        
        if( needleIsString && typeof obj === STRING ) {
            return obj.indexOf(str) > -1;
        }
    
        if( Object(obj) !== obj ) {
            return false;
        }

        if( ___isArray( obj ) ) {
            return indexOf(obj, str) > -1;
        }

        if( needleIsString ) {
            return false;
        }

        return ___hasown.call( obj, str );
    };
    
    var ___hasown = method.hasOwn = Object.prototype.hasOwnProperty;
    
    var ___isArray = method.isArray = Array.isArray || function( obj ) {
        return !!(obj && toString.call(obj) === OBJECT_ARRAY);
    };
    
    var ___isObject = method.isObject = function( obj ) {
        return !!(obj && Object(obj) === obj && typeof obj === OBJECT );
    };
    
    var ___ensureArrayLike = method.ensureArrayLike = function(obj) {
        if( ___isArray( obj ) && isFinite(obj.length) ) {
            return obj;
        }
        
        return [];
    };
    
    var ___Safe = method.Safe = (function() {
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
    
    
    var ___safeString__ = method.safeString = (function() {

        
        var NO_ESCAPE = 0,
            HTML = 1,
            ATTR = 2,
            ATTR_NAME = 4,
            URI = 8,
            URI_PARAM = 16,
            SCRIPT = 32,
            SCRIPT_IN_ATTR = 64,
            CSS = 128,
            HTML_COMMENT = 256,
            SCRIPT_IN_URI_PARAM_ATTR = 512,
            escapes = {};


        var uriAttr = /^(?:src|lowsrc|dynsrc|longdesc|usemap|href|codebase|classid|cite|archive|background|poster|action|formaction|data)$/;
        
        var getAttrEscapeFunction = function( attrName ) {
            attrName = escapeForAttrName(attrName).toLowerCase();
            
            if( uriAttr.test( attrName ) ) {
                return URI;
            }
            else if( attrName === "style" ) {
                return CSS
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
                var scheme;
                if( rurlstart.test(str)) {
                    //TODO this isn't good
                    return escapeForAttr(encodeURI(str));
                }
                return "#";
            },
            
            /*TODO: does attribute escaping too although not necessary in style tags*/
            escapeForUriParam = function( str ) {
                return escapeForAttr(encodeURIComponent(str));
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

        return function( string, escapeFn) {
            var passAsIs = (escapeFn & passedAsIs) > 0;
        
            if( !passAsIs && ___isArray( string ) ) {
                //Convert arrays to a string by joining them
                if( string.length ) {
                    if( string[0] instanceof ___Safe ) { //Assumption: If one item in an array is a ___Safe - others are too
                        var r = [],
                            safeFor = string[0].safeFor;
                        
                        for( var i = 0, l = string.length; i < l; ++i ) {
                            r.push( string[i].string );
                        }
                        string = new ___Safe( r.join(""), safeFor );
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
                return ___safeString__( string, escapeFn );                
            }
            
            if( string instanceof ___Safe ) { /*wat, TODO: account for raw*/
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
    
    var extensions = {
        ___Array: {},
        ___String: {},
        ___Number: {},
        ___Boolean: {},
        ___Object: {},
        ___RegExp: {},
        ___Date: {},
        Math: Math,
        Date: Date
    };
    method.___getExtensions = function() {
        return extensions;
    };
    
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
    var validMethodExtensions = "Array String Number Boolean Object RegExp Date".split(" ");

    var rinvalidname = /^___/;

    Runtime.registerExtension = function( name, value ) {
        var split;
        if( !___isObject(value) && typeof value !== FUNCTION ) {
            throw new Error("Can only register functions or objects as extensions");
        }
        if( rinvalidname.test(name) ) {
            throw new Error("Names starting with ___ are reserved for internal use");
        }
        if( ( split = name.split(".") ).length > 1 ) {
            if( indexOf( validMethodExtensions, split[0] ) > -1 ) {
                if( typeof value !== FUNCTION ) {
                    throw new Error( "Native extensions must be functions.");
                }
                extensions[ "___" + split[0]][split[1]] = value;
            }
            else {
                throw new Error( "Valid native extensions are: " + validMethodExtensions.join(", ") + ". Given: '"+split[0]+"'.");
            }
        }
        else {
            extensions[name] = value;
        }
    };
    
    return Runtime;
})();

if( typeof module !== "undefined" && module.exports ) {
    module.exports = Runtime;
}
else if ( typeof define === "function" && define.amd && define.amd.attemplate ) {
    define( "Runtime", [], function () { return Runtime; } );
}
else if ( global ) {
    global.Runtime = Runtime;
}

})(this);