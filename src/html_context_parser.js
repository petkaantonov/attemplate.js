var HtmlContextParser = (function() {

    var CssContextParser = (function() {
        var method = CssContextParser.prototype;
        
        function CssContextParser() {
          
        }
        
        return CssContextParser;
    })();


    var context = {
        NO_ESCAPE: {name: 0},
        HTML: {name: 1},
        ATTR: {name: 2},
        ATTR_NAME: {name: 4},
        URI: {name: 8},
        URI_PARAM: {name: 16},
        SCRIPT: {name: 32},
        SCRIPT_IN_ATTR: {name: 64},
        CSS: {name: 128}
    };
    
    HtmlContextParser.context = context;

    var method = HtmlContextParser.prototype;
                   //tagopen         //attribute open             //closing tag           //tagclose    //URL-param characters     //HTML comment end
    var chunker = /(?:<!?([a-z0-9_-]+)|([a-z0-9_-]+)\s*=\s*(["']|[^"']|$)|<\/\s*([a-z0-9_-]+)>|(\/?>)|(["'])|([:/?.])|(refresh)|(dataurl)|(--)>)/g;
                                                                                                 //attrclose     //URI context special cases

    var uriAttr = /^(?:src|lowsrc|dynsrc|longdesc|usemap|href|codebase|classid|cite|archive|background|poster|action|formaction|data)$/;
    var selfClosing = /^(?:doctype|area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
    var charData = /^(?:script|style|textarea|title|--)$/;
    
    function HtmlContextParser() {
        this.context = context.HTML;
        this.tagStack = [];
        this.openedTag = null;
        this.currentAttr = null;
        
        this.dynamicAttr = null;
        
        this.currentAttrQuote = null; //The quote type that closes the attribute
        
        //Special url context in the case <meta http-equiv="refresh" content="0; URL=javascript:">
        this.inMetaRefresh = false;

        //Special url context in the case <param name="DataURL" VALUE="javascript:">
        this.inDataUrl = false;

        //While in script, style, textarea or title tag, context doesn't change until it is closed
        this.inCharData = false;
        
        this.currentIndex = 0;
        this.lastLength = 0;
        
        //For stack
        this.prev = null;
    };
    
    method.pushStack = function() {
        var ret = new HtmlContextParser();
        ret.prev = this;
        return ret;
    };
    
    method.clone = function() {
        var ret = new HtmlContextParser();
        for( var key in this ) {
            if( this.hasOwnProperty(key) ) {
                ret[key] = this[key];
            }
        }
        return ret;
    };
    
    method.popStack = function() {
        this.close();
        if( !this.prev ) {
            return this;
        }
        return this.prev;
    };
    
    //Needed to escape attributes with dynamic keys
    method.isWaitingForAttr = function() {
        return !!(this.openedTag && !this.currentAttr);
    };
    
    method.dynamicAttribute = function( expr, quote ) {
        this.currentAttr = this.dynamicAttr = expr;
        this.currentAttrQuote = quote;
        this.context = expr;
    };
        
    method.currentTagName = function() {
        return this.tagStack[this.tagStack.length-1] || null;
    };

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
            doError("Cannot open '<"+tagName+">', '<"+this.openedTag+">' is waiting for closing or more attributes.", this.getIndex() );
        }
        if( tagName == "--" ) {
            this.inCharData = true;
            this.tagStack.push(tagName);
            this.context = context.HTML;
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

    method.tagClose = function( name ) {
        var equalsCurrent = this.currentTagName() === name;
        
        if( this.inCharData && equalsCurrent ) {
            this.tagStack.pop();
            this.context = context.HTML;
            this.inCharData = false;
        }
        else if( this.inCharData || this.currentAttr ) {
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
            doError("Cannot close tag '<" + name + ">', the current tag is '<"+this.currentTagName()+">'.", this.getIndex() ); 
        }
    };

    method.attributeOpenStart = function( attrName, quoteType ) {
        if( !this.openedTag || this.inCharData || this.currentAttr ) {
            return;
        }

        if( quoteType !== "'" && quoteType !== '"' ) {
            doError( "Attribute '"+attrName+"' in tag '<"+this.openedTag+">' is not quoted.", this.getIndex() );
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

    method.uriParamValue = function() {
        if( this.inCharData ) return;

        if( this.currentAttr && this.isUriAttr(this.currentAttr) ) {
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
                this.uriParamValue();
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
            prevIndex = this.lastIndex;
        }
    };
    
    method.getIndex = function() {
        return this.currentIndex + (this.lastIndex - this.lastLength);
    };

    method.close = function() {
        if( this.openedTag ) doError( "'<" + this.openedTag + ">' has not been closed.", this.getIndex() );

        var tagName = this.currentTagName();
        if( tagName ) doError( "'<" + tagName + ">' is still open.", this.getIndex() );
    };

    method.getContext = function() {
        return this.context;
    };
    
    return HtmlContextParser;
})();