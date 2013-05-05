var HtmlContextParser = (function() {

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

    var copyProps = function( src, target ) {
        target.context = src.context;
        target.tagStack = src.tagStack.slice(0);
        target.openedTag = src.openedTag;       
        target.currentAttr = src.currentAttr; 
        target.currentAttrQuote = src.currentAttrQuote;
        target.dynamicAttr = src.dynamicAttr; 
        target.inMetaRefresh = src.inMetaRefresh;
        target.inDataUrl = src.inDataUrl;
        target.inCharData = src.inCharData;
        target.currentIndex = src.currentIndex; 
        target.lastLength = src.lastLength;
        target.prev = src.prev;
        target.savedBranch = src.savedBranch;
        target.silentErrors = src.silentErrors;
    };

    method.clone = function() {
        var ret = new HtmlContextParser();
        copyProps( this, ret );
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
    
    method.toJSON = function() {
        var ret = {};
        copyProps( this, ret );
        return JSON.stringify(ret);
    };
    
    method.stateFromJSON = function( json ) {
        var src = JSON.parse(json);
        copyProps( src, this );
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
})();