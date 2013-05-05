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
    "use strict";
    
    var doError = function() {
    
    };var HtmlContextParser = (function() {

    //Broken or unimplemented    
    //TAG_NAME
    //CSS_QUOTED_URI in style tag 
    //CSS_UNQUOTED_URI in style tag
    //CSS_QUOTED_URI in style attr
    //CSS_UNQUOTED URI in style attr
    //CSS_QUOTED_URI_PARAM in style tag
    //CSS_UNQUOTED_URI_PARAM in style tag
    //CSS_QUOTED_URI_PARAM in style attr
    //CSS_UNQUOTED URI_PARAM in style attr
    
    //SCRIPT_IN_CSS_QUOTED_URI in style tag
    //SCRIPT_IN_CSS_UNQUOTED_URI in style tag
    //SCRIPT_IN_CSS_QUOTED_URI in style attr
    //SCRIPT_IN_CSS_UNQUOTED URI in style attr
    //SCRIPT_IN_CSS_QUOTED_URI_PARAM in style tag
    //SCRIPT_IN_CSS_UNQUOTED_URI_PARAM in style tag
    //SCRIPT_IN_CSS_QUOTED_URI_PARAM in style attr
    //SCRIPT_IN_CSS_UNQUOTED URI_PARAM in style attr
    
    //CSS_STRING_QUOTED attr
    //CSS_STRING_QUOTED tag
    //URI ATTR
    //URI_PARAM_ATTR
    //CSS_ATTR arbirtrary css in style attr
    //CSS arbitrary css in style tag
    
    //SCRIPT_IN_URI_PARAM_ATTR

    //Flyweight enum + runtime bitwise checks for speed at the same time
    var context = {
        NO_ESCAPE: {name: 0}, //Special flag for when escaping is not applied
        
        
        HTML: {name: 1}, //Dynamic data inside non-special html tags or outside any tags at all. The initial context.
                        //e.g <div>Hello, @data</div>
                        
                        //Probably 80-90% of dynamic data insertion cases
        
        
        ATTR: {name: 2}, //Dynamic data in a plain attribute with no possibly harmful immediate interpretation
                        //e.g. value="@data"
                        
                        //The engine enforces that all attributes are delimited with either ' or "
                        //so unquoted attribute context doesn't exist
        
        
        ATTR_NAME: {name: 4}, //Dynamic data fully, or partly, composes an attribute name.
                            //e.g <div @attr="key"
                            //if the "key" part is dynamic as well, it becomes a special case
                            //where context is determined for it by the runtime value of @attr
                            
                            //TODO use .writeDynamic to determine part
        
        
        URI: {name: 8}, //Where the dynamic data would start an uri in an html attribute 
                        //e.g href="@data" 
        
        
        URI_PARAM: {name: 16}, //Where the dynamic data would be placed on a statically started uri in an html attribute 
                                //e.g href="/mysite?@param"
        
        
        SCRIPT: {name: 32}, //Arbitrary placement of dynamic data when inside a script tag. 
                            //e.g. <script>@data</script>. this can actually be secured for without sacrificing most use cases with a ridiculously simple implementation. 
                            
                            //Unsupported use case is where one wants to inject exectuble script code from dynamic data.
                            //e.g. @data = "function(){alert('hello');}"
                            
                            //<script>@data</script> cannot be supported in the "expected" way.
        
        
        SCRIPT_IN_ATTR: {name: 64}, //Placement of dynamic data when inside a html attribute that gets interpreted as a script
                        //e.g onmouseover="alert(@data)". There is no valid use cases for this but it can easily happen.
                         //like in SCRIPT, the placement doesn't matter in the script.
        
        
        CSS: {name: 128}, //Arbitrary placement of dynamic data when inside a <style> tag. 
                            //e.g. <style>@data</style
                            //Unlike SCRIPT, this cannot be secured for, any dynamic data in this context is "escaped" currently to the empty string
        
        
        HTML_COMMENT: {name: 256}, //Placement of dynamic data in html comments, -- becomes special.
                                    //e.g. <!-- @data -->
                                    //use cases probably include something like rendering rendering time dynamically in a comment
        
        
        SCRIPT_IN_URI_PARAM_ATTR: {name: 512} //Placement of dynamic data when inside a html attribute that gets interpreted
                                            //as an URI where javascript: is statically placed so the data
                                            //gets interpreted as javascript. The decode stack goes 3 levels deep: ATTR -> URI -> JAVASCRIPT
                                            //e.g. <a href="javascript: alert(@data);">
                                            //Sometimes used as an alternative for the just as bad onclick=""
    };
    
    

    var CssContextParser = (function() {
        var method = CssContextParser.prototype;
        
        function CssContextParser() {
          
        }
        
        return CssContextParser;
    })();

    HtmlContextParser.context = CssContextParser.context = context;
    var method = HtmlContextParser.prototype;
    
    
                   //tagopen         //attribute open             //closing tag           //tagclose                   //SCRIPT_IN_URI        //HTML comment end //URL-param characters    
    var chunker = /(?:<!?([a-z0-9_:-]+)|([:a-z0-9_-]+)\s*=\s*(["']|[^"']|$)|<\/([a-z0-9:_-]+)\s*\/?\s*>|(\/?>)|(["'])|(javascript|data):|(refresh)|(dataurl)|(--)>|([:/?.#]))/g; //toLowerCase() is called on the string
                                                                                                 //attrclose     //URI context special cases

    var uriAttr = /^(?:src|lowsrc|dynsrc|longdesc|usemap|href|codebase|classid|cite|archive|background|poster|action|formaction|data)$/;
    var selfClosing = /^(?:doctype|area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
    var charData = /^(?:script|style|textarea|title|--)$/; //Elements that will only be closed by the sequence </elementName\s*\/?\s*> or --> in case of a comment

    method.clone = function() {
        var ret = new HtmlContextParser();
        ret.context = this.context;
        ret.tagStack = this.tagStack.slice(0);
        ret.openedTag = this.openedTag;       
        ret.currentAttr = this.currentAttr; 
        ret.currentAttrQuote = this.currentAttrQuote;
        ret.dynamicAttr = this.dynamicAttr; 
        ret.inMetaRefresh = this.inMetaRefresh;
        ret.inDataUrl = this.inDataUrl;
        ret.inCharData = this.inCharData;
        ret.currentIndex = this.currentIndex; 
        ret.lastLength = this.lastLength;
        ret.prev = this.prev;
        ret.savedBranch = this.savedBranch;
        ret.silentErrors = this.silentErrors;
        return ret;
    };
    
    function HtmlContextParser() {
        this.context = context.HTML;
        this.tagStack = []; //Stack of tag names to pop when one gets closed
        
        this.openedTag = null; //The tag name that is currently open or null. 
                               //Open, as in the tag declaration is open: '<div open-here'
                               //'>' would close the tag in this sense and put it on the tagStack.
                               
        this.currentAttr = null; //The attribute name that is currently open, requires a tag to be opened
        this.currentAttrQuote = null; //The quote type that opened the current attribute, and therefore closed it
        
        
        this.dynamicAttr = null; //The current dynamic attribute or null. Similar to currentAttr but is special.
        
        //Special url context in the case <meta http-equiv="refresh" content="0; URL=javascript:">
        this.inMetaRefresh = false;

        //Special url context in the case <param name="DataURL" VALUE="javascript:">
        this.inDataUrl = false;

        //While in script, style, textarea or title tag, context doesn't change until it is closed
        this.inCharData = false;
        
        
        //Index wizardry For error reporting
        this.currentIndex = 0; 
        this.lastLength = 0;
        
        //For parser stack when juggling between sections that are considered completely independent of each other
        this.prev = null;
        //For parser stack for branches so that the html inside if doesn't affect the parallel else ifs / ifs
        this.savedBranch = null;
        
        this.silentErrors = false;
    };
    
    method.reset = function() {
        HtmlContextParser.call(this);
    };
    
    method.saveBranch = function() {
        var ret = this.clone();
        ret.savedBranch = this;
        return ret;
    };
    
    method.restoreBranch = function() {
        if( !this.savedBranch ) {
            return this;
        }
        return this.savedBranch;
    };
    
    method.pushStack = function() {
        var ret = new HtmlContextParser();
        ret.prev = this;
        return ret;
    };
    
    method.popStack = function() {
        if( !this.prev ) {
            return this;
        }
        this.close();
        return this.prev;
    };
    
    //Needed to escape attributes with dynamic keys
    method.isWaitingForAttr = function() {
        return !!(this.openedTag && !this.currentAttr);
    };
    
    method.enableErrors = function() {
        this.silentErrors = false;
        return this;
    };
  
    method.disableErrors = function() {
        this.silentErrors = true;
        return this;
    };
    
    method.dynamicAttribute = function( expr, quote ) {
        this.currentAttr = this.dynamicAttr = expr;
        this.currentAttrQuote = quote;
        this.context = expr;
    };
        
    method.currentTagName = function() {
        return this.tagStack[this.tagStack.length-1] || null;
    };

    //Not the formal term, tests for script|style|textarea|title|--
    method.isCharData = function( tagName ) {
        return charData.test( tagName );
    };

    method.isSelfClosing = function( tagName ) {
        return selfClosing.test( tagName );
    };

        //If attribute name starts with "on" it's javascript
        //Custom attributes should start with data-
        //eg data-online
    method.isScriptAttr = function( attrName ) {
        return attrName.charAt(0) === "o" &&
            attrName.charAt(1) === "n";
    };

    method.isUriAttr = function( attrName ) {
        //Special cases
        if( this.inMetaRefresh && attrName === "content" ||
            this.inDataUrl && attrName === "value" ) {
            return true;
        }
        //Normal case can be seen just from attribute name
        else {
            return uriAttr.test( attrName );
        }
    };

    method.isCssAttr = function( attrName ) {
        return attrName === "style";
    };

    method.tagOpenStart = function( tagName ) {
        if( this.inCharData || this.currentAttr ) return;
        
        if( this.openedTag ) {
            if( !this.silentErrors ) {
                doError("Cannot open '<"+tagName+">', '<"+this.openedTag+">' is waiting for closing or more attributes.", this.getIndex() );
            }
            return;
        }
        if( tagName == "--" ) {
            this.inCharData = true;
            this.tagStack.push(tagName);
            this.context = context.HTML_COMMENT;
            this.openedTag = null;
            return;
        }
        this.openedTag = tagName;
        this.context = context.ATTR_NAME;
    };

    method.tagOpenEnd = function( openEndSyntax ) {
        if( !this.openedTag || this.inCharData || this.currentAttr ) {
            return;
        }
        this.inMetaRefresh = this.inDataUrl = false;

        var tagName = this.openedTag;
        this.context = context.HTML;
        this.openedTag = null;

        if( this.isCharData( tagName ) ) {

            if( tagName === "script" ) {
                this.context = context.SCRIPT;
            }
            else if( tagName === "style" ) {
                this.context = context.CSS;
            }

            this.tagStack.push(tagName);        
            this.inCharData = true;
        }
        else if( openEndSyntax !== "/>" && !this.isSelfClosing( tagName ) ) {
            this.tagStack.push(tagName);
        }
    };
    
    method.indexOfTagInStack = function( tagName) {
        for( var l = this.tagStack.length - 1; l >= 0; l-- ) {
            if( this.tagStack[l] === tagName ) {
                return l;
            }
        }
        return -1;
    };

    method.tagClose = function( name ) {
        var equalsCurrent = this.currentTagName() === name;
        
        if( this.inCharData && equalsCurrent ) {
            this.tagStack.pop();
            this.context = context.HTML;
            this.inCharData = false;
        }
        else if(this.inCharData || this.currentAttr || this.openedTag) {
            return;
        }
        else if( equalsCurrent ) {
            this.tagStack.pop();
            this.context = context.HTML;
        }
        else if( this.isSelfClosing( name ) ) {
            return;
        }
        else {
            if( !this.silentErrors ) {
                doError("Cannot close tag '<" + name + ">', the current tag is '<"+this.currentTagName()+">'.", this.getIndex() ); 
            }
            else {
                var index = this.indexOfTagInStack( name );
                if( index > -1 ) {
                    this.tagStack = this.tagStack.slice(index);
                    this.context = context.HTML;
                }
            }
        }
    };

    method.attributeOpenStart = function( attrName, quoteType ) {
        if( !this.openedTag || this.inCharData || this.currentAttr ) {
            return;
        }

        if( quoteType !== "'" && quoteType !== '"' ) {
            if( !this.silentErrors ) {
                doError( "Attribute '"+attrName+"' in tag '<"+this.openedTag+">' is not quoted.", this.getIndex() );
            }
            return;
        }
        this.currentAttr = attrName;
        this.currentAttrQuote = quoteType;

        if( this.isScriptAttr( attrName ) ) {
            this.context = context.SCRIPT_IN_ATTR;
        }
        else if( this.isUriAttr( attrName ) ) {
            this.context = context.URI;
        }
        else if( this.isCssAttr( attrName ) ) {
            this.context = context.CSS;
        }
        else {
            this.context = context.ATTR;
        }
    };

    method.attributeOpenEnd = function( quoteType ) {
        if( this.inCharData ) return;

        if( this.currentAttrQuote === quoteType ) {
            this.dynamicAttr = this.currentAttr = null;
            this.currentAttrQuote = null;
            this.context = context.ATTR_NAME;
        }
    };
    
    method.maybeUriScript = function() {
        if( this.inCharData ) return;

        if( this.currentAttr && this.context === context.URI &&
            this.isUriAttr(this.currentAttr) ) {
            this.context = context.SCRIPT_IN_URI_PARAM_ATTR;
        }
    };

    method.uriParamValue = function() {
        if( this.inCharData ) return;

        if( this.currentAttr && this.context === context.URI &&
            this.isUriAttr(this.currentAttr) ) {
            this.context = context.URI_PARAM;
        }
    };

    method.metaRefresh = function() {
        if( this.inCharData || !this.currentAttr ) return;

        if( this.currentAttr === "http-equiv" && this.openedTag === "meta" ) {
            this.inMetaRefresh = true;
        }
    };
    
    


    method.dataUrl = function() {
        if( this.inCharData || !this.currentAttr ) return;

        if( this.currentAttr === "name" && this.openedTag === "param" ) {
            this.inDataUrl = true;
        }
    };
    
    method.writeDynamic = function(){
        //TODO 
    };

    method.write = function( html, index ) {
        if( !html ) {
            return;
        }
        chunker.lastIndex = 0;
        this.currentIndex = index;
        html = html.toLowerCase();
        var prevIndex = 0;
        var m;

        while( m = chunker.exec( html ) ) {
            this.lastIndex = chunker.lastIndex;
            this.lastLength = this.lastIndex - prevIndex - 1;
            if( m[1] ) {
                this.tagOpenStart( m[1] );
            }
            else if( m[2] ) {
                this.attributeOpenStart( m[2], m[3] );
            }
            else if( m[4] ) {
                this.tagClose( m[4] );
            }
            else if( m[5] ) {
                this.tagOpenEnd(m[5]);
            }
            else if( m[6] ) {
                this.attributeOpenEnd( m[6]);
            }
            else if( m[7] ) {
                this.maybeUriScript();
            }
            else if( m[8] ) {
                this.metaRefresh();
            }
            else if( m[9] ) {
                this.dataUrl();
            }
            else if( m[10] ) {
                this.tagClose(m[10]);
            }
            else if( m[11] ) {
                this.uriParamValue();
            }
            prevIndex = this.lastIndex;
        }
    };
    
    method.getIndex = function() {
        return this.currentIndex + (this.lastIndex - this.lastLength);
    };

    method.close = function() {
        if( !this.silentErrors ) {
            if( this.currentAttr ) doError( "Attribute '"+this.currentAttr+"' in tag '<" + this.openedTag + ">' has not been closed.", this.getIndex() );
            if( this.openedTag ) doError( "'<" + this.openedTag + ">' has not been closed.", this.getIndex() );
            if( this.currentTagName() ) doError( "'<" + this.currentTagName() + ">' is still open.", this.getIndex() );
        }
    };

    method.getContext = function() {
        return this.context;
    };
    
    return HtmlContextParser;
})();var Runtime = (function() {
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
    
    var ___ctx = method.contextParser = function() {
        return new HtmlContextParser().disableErrors();
    };
    
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

        
        var NO_ESCAPE = HtmlContextParser.context.NO_ESCAPE.name,
            HTML = HtmlContextParser.context.HTML.name,
            ATTR = HtmlContextParser.context.ATTR.name,
            ATTR_NAME = HtmlContextParser.context.ATTR_NAME.name,
            URI = HtmlContextParser.context.URI.name,
            URI_PARAM = HtmlContextParser.context.URI_PARAM.name,
            SCRIPT = HtmlContextParser.context.SCRIPT.name,
            SCRIPT_IN_ATTR = HtmlContextParser.context.SCRIPT_IN_ATTR.name,
            CSS = HtmlContextParser.context.CSS.name,
            HTML_COMMENT = HtmlContextParser.context.HTML_COMMENT.name,
            SCRIPT_IN_URI_PARAM_ATTR = HtmlContextParser.context.SCRIPT_IN_URI_PARAM_ATTR.name,
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

        return function( string, escapeFn ) {
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