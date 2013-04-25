var compiledTemplates = {};

var globalsAvailable = {"Math": true, "Date": true};

function trimRight( str ) {
    return str.replace(/\s\s*$/, "");
}

function getEscapeFnByName( name ) {
    switch( name ) {
        case "json" : return "SCRIPT";
        case "js" : return "SCRIPT";
        case "raw" : return "NO_ESCAPE";
        case "attr" : return "ATTR";
        case "css" : return "CSS";
        case "uri" : return "URI";
        case "uriparam" : return "URI_PARAM";
        case "html" : return "HTML";
        default: return "HTML";
    }
}



/* global state */

var input,
    character,
    i,
    output,
    keywordBlockStack,
    token,
    type,
    value,
    blockType,
    helpers,
    auxI,
    scope,
    parsed,
    endReturn,
    escapingNext = false,
    escapeFn,
    nextCharForced = null,
    htmlContextParser = null,

    exported = {},

    /* constants / helpers */

    __push = [].push,

    doubleQuote = '"',
    singleQuote = "'",
    escapeChar = "\\",

    EXPRESSION = 0,
    BLOCK = 1,
    END_OF_INPUT = 2,
    STRING = 3,
    KEYWORD_BLOCK_OPEN = 4,
    KEYWORD_BLOCK_CLOSE = 5,

    TEMPLATE_SCOPE = 6,
    HELPER_SCOPE = 7,

    SHORT_EXPRESSION = 8,
    LONG_EXPRESSION = 9,
    KEYWORD_EXPRESSION = 10,

    mapType = {

        "0" : "EXPRESSION",
        "1" : "LITERAL_BLOCK",
        "2" : "END_OF_INPUT",
        "3" : "STRING",
        "4" : "KEYWORD_BLOCK_OPEN",
        "5" : "KEYWORD_BLOCK_CLOSE"

    },

    mapSpecial = {
        "8" : "SHORT_EXPRESSION",
        "9" : "LONG_EXPRESSION",
        "do": "DO BLOCK",
        "for": "FOR BLOCK",
        "while": "WHILE BLOCK",
        "if": "IF BLOCK",
        "else": "ELSE BLOCK",
        "helper": "HELPER BLOCK",
        "foreach": "FOREACH BLOCK"
    },



    rescapekeyword = /^(attr|raw|js|uri|uriparam|json|html|css):/,
    rlineterminator = /[\n\r\u2028\u2029]+/g,
    rwhitespace = /\s/,
    rwscollapse = /\s+/g,
    rnltonewline = /\n\s*/g,
    rescapequote = /([\\'])/g,
    rjsident = /[0-9A-Za-z$_]/,
    rwhitespaceonly = /^\s+$/,
    rexport = /(?:^|[^\\])@export\x20as\x20([A-Za-z$_][0-9A-Za-z$_]*)/,
    rimport = /(?:^|[^\\])@import\x20([A-Za-z$_][0-9A-Za-z$_]*)(?:\x20as\x20([A-Za-z$_][0-9A-Za-z$_]*))?/g,
    rprop = /(?:\[\s*(?:('(?:[^']|\\')*')|("(?:[^"]|\\")*")|([A-Za-z$_][0-9A-Za-z$_]*))\s*\]|\s*\.\s*([A-Za-z$_][0-9A-Za-z$_]*))/g,

    //TODO Share with htmlcontext
    lineterminatorReplacer = function(m) {
        var len;
        
        if( ( len = m.length ) === 1 ) {
            switch( m ) {
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\u2028": return "\\u2028";
                case "\u2029": return "\\u2029";
            }
        }
        var ret = "";
        for( var i = 0; i < len; ++i ) {
            switch( m.charAt(i) ) {
                case "\n": ret += "\\n"; break;
                case "\r": ret += "\\r"; break;
                case "\u2028": ret += "\\u2028"; break;
                case "\u2029": ret += "\\u2029"; break;
            }
        }
        return ret;
    },

    specials = {
        "@": true,
        "}": true, //This is only special if we have some kind of keyword block in the stack,
        "\\": true
    },

    keywords = {
        "continue": true,
        "break": true,
        "foreach": true,
        "for": true,
        "if": true,
        "else": true,
        "helper": true
    },


    //Keywords that start a loop
    loopKeywords = {
        "for": true,
        "foreach": true
    },

    //Keywords that don't start a block
    //Also consider loop breaking constructs for now
    inlineKeywords = {
        "continue": true,
        "break": true
    };




var rblockspecial = /^(?:if|for|foreach|helper|else)\b/;

function isBlockAheadForWhiteSpaceTrim() {
    
    var ahead = lookahead(1);
    
    if( ahead === "@" ) { //all blocks start with @
        return rblockspecial.test(input.substr(i+1, 7 ) );
    }
    else if( ahead === "e" ) { //...except for [e]lse 
        return rblockspecial.test(input.substr(i, 7 ) );
    }
    return false;
}

function isWhiteSpace( str ) {
    return (str === ' ' || str === "\n") || rwhitespaceonly.test( str );
}

//get the next len characters from current position
function lookahead( len ) { 
    return len === 1 ? input.charAt(i) : input.substr( i, len );
}

function skipWhiteSpace() {
    while( ( character = input.charAt( i++ ) ) ) {
        if( !isWhiteSpace( character ) ) {
            i--;
            break;
        }
    }
}
//Bugs here     
function skipNewLineAndIndentation() {
    var ahead = lookahead(1), wsCount = 0;
    
    if( ahead === "\n" ) {
        i++;
        skipWhiteSpace();
        i--;
    }
}

function isNextWord( word ) {
    var cur = i, character,
        test = "", len = word.length;

        while( ( character = input.charAt( cur++ ) ) && test.length <= len ) {

            if( !rwhitespace.test( character )  ) {
                test += character;
            }

            if( test === word ) {
                return true;
            }
        }
    return false;
}

function consumeUntilSpecial() {
    var character, ret = "";;
        while( character = input.charAt(i++) ) {
            if( specials[character] === true ) {
                i--;
                break;
            }
            ret += character;
        }
    return ret;
}


function doError( msg, currentIndex ) {
    var index = arguments.length === 2 ? currentIndex : i,
        lines = input.split(/\n/g),
        lineno = -1,
        column = -1,
        last = 0,
        total = 0,
        line;

    if( lines.length <= 1 ) {
        column = index;
        line = lines[0];
        throw new Error( msg + " On line 1, column " + (column + 1) );
    }

    for( var j = 0; j < lines.length; ++j ) {
        var len = lines[j].length;

        if( last <= index && index <= last + len ) {
            column = index - total - 1;
            lineno = j+1;
            line = lines[j];
            break;
        }
        total += len + 1;
        last += (len + 1);
    }

    if( lineno < 0 ) {
        column = index - total;
        line = lines[lines.length-1];
        lineno = j;
    }

    throw new Error( msg + " On line " + lineno  + ", column " + (column + 1) );
}

function createDelimitParser( OPEN, CLOSE ) {
    return function() {
        var character,
            ret = "", lastStrOpen = null,
            delimiterStack = [OPEN];

        while( character = input.charAt(i++) ) {
                    //Keep track of string literal stack so we know when we can ignore ( ) { or }
            if( ( character === singleQuote || character === doubleQuote ) && input.charAt(i-2) !== escapeChar ) {

                if( lastStrOpen === null ) {
                    lastStrOpen = character;
                }
                else if( lastStrOpen === singleQuote && character === singleQuote ||
                         lastStrOpen === doubleQuote && character === doubleQuote
                ) {
                    lastStrOpen = null;
                }
                else if( lastStrOpen === character ) {
                    doError( "Error when parsing "+ret+": unescaped character - '"+character + "'." );
                }
                ret += character;
            }

            else if( character === OPEN ) {
                //The opener is only meaningful if its outside a string literal
                if( lastStrOpen === null ) {
                    delimiterStack.push( OPEN );
                }
                ret += character;

            }
            else if( character === CLOSE )  {
                //Same for closer
                if( lastStrOpen === null ) {

                    if( delimiterStack.pop() !== OPEN ) {
                        doError( "Error when parsing "+ret+": unbalanced delimiters." );
                    }

                    if( !delimiterStack.length ) {
                        return ret; //Well balanced expression/block
                    }
                }
                ret += character;
            }
            else {
                ret += character;
            }
        }

        //Check for unbalanced string literals or braces

        if( lastStrOpen !== null ) {
            doError( "Error when parsing "+ret+": unterminated string." );
        }
        else if( delimiterStack.length ) {
            doError( "Error when parsing "+ret+": unbalanced delimiters." );
        }

        return ret;
    };
}

var rsimplechars = /[_$0-9A-Za-z]/,
    rsimplecontinuation = /[\[\(\.]/; //Dot 

var parseSimpleExpression = (function() {
    var IDENT_OR_CONTINUATION = {},
        PUREIDENT = {},
        CONTINUATION = {},
        ANYTHING = {};

    return function() {
        var ret = "", character, pStack = [], 
            lastChar = "", mode = PUREIDENT, escapingString = false,
            originalIndex = i,
            anythingStarted = 0; //Index where the ANYTHING mode last started from

        loop: while( character = input.charAt(i++ ) ) {

            switch( mode ) {
                case PUREIDENT:
                    if( !rsimplechars.test(character) ) {
                        if( character !== "" ) i--;
                        if( !ret.length ) {
                            return "@";
                        }
                        break loop;
                    }
                    else {
                        ret += character;
                        lastChar = character;
                        mode = IDENT_OR_CONTINUATION;
                    }
                break;

                case IDENT_OR_CONTINUATION:
                    if( rsimplecontinuation.test(character)) {
                        if( keywords[ret] === true ) {
                            i--;
                            return ret;
                        }
                        if( character !== "." ) {
                            
                            anythingStarted = i-1;
                            mode = ANYTHING;
                            pStack.push([character, i-1]);
                        }
                        else {
                            mode = PUREIDENT;
                        }
                    }
                    else if( !rsimplechars.test(character) ) {
                        if( character !== "" ) i--;
                        break loop;
                    }
                    ret += character;
                    lastChar = character;
                break;

                case ANYTHING:
                    var peek = pStack[pStack.length - 1];



                    if( peek && (peek[0] === '"' || peek[0] === "'") ) {
                        if( escapingString ) {
                            escapingString = false;
                            lastChar = character;
                            ret += character;
                            break;
                        }
      
                        if( character === '\\' ) {
                            escapingString = true;
                        }
                        else if( character === peek[0] ) {
                            pStack.pop();
                        }
                        lastChar = character;
                        ret += character;
                        break;
                    }


                    if( character === "(" ||
                        character === "[" ||
                        character === "'" ||
                        character === '"' ) {
                        pStack.push([character, i-1]);
                    }
                    else if( peek && (character === ")" && peek[0] === "("
                        || character === "]" && peek[0] === "[" )) {

                        if( character === "]" && lastChar === "[" ) {
                            i = peek[1]; //Use the empty index operator as html syntax
                            ret = input.substring(originalIndex, i);
                            pStack = [];
                            break loop;
                        }
                        pStack.pop();
                    }
                    else if( rsimplecontinuation.test(character) && character !== "." ) {
                        //Syntax error fallback
                        //It was never in the stack @aosdkasd[ ok okasd odsa da do dkos ) -> aosdkasd becomes id and becomes html
                        //or it was in the stack like @soaodad[ (aosdsdasda okosadad)] -> soaodad becomes id and [ (aosdsdasda ] becomes html
                        var lookbehind = character === "]" ? "[" : "(";

                        for( var j = 0; j < pStack.length; ++j ) {
                            if( pStack[j][0] === lookbehind ) {
                                i = pStack[j][1];
                                pStack = [];
                                ret = input.substring(originalIndex, i);
                                break loop;
                            }
                        }
                        i = anythingStarted;
                        pStack = [];
                        ret = input.substring(originalIndex, i-1);
                        break loop;

                    }

                    if( !pStack.length ) {
                        mode = CONTINUATION;
                    }
                    
                    lastChar = rwhitespace.test(character) ? lastChar : character;
                    ret += character;
                break;


                case CONTINUATION:
                    if( !rsimplecontinuation.test(character)) {
                        if( character !== "" ) i--;
                        break loop;
                    }
                    if( character === "." ) {
                        mode = PUREIDENT
                    }
                    else {
                        pStack.push([character, i-1]);
                        anythingStarted = i-1;
                        mode = ANYTHING;
                    }
                    lastChar = character;
                    ret += character;
                break;




            }

        }

        if( pStack.length && anythingStarted ) {
            ret = input.substring(originalIndex, anythingStarted);
            i = anythingStarted;
        }
        else if( lastChar === "." ) {
            i--;
            return ret.substr(0, ret.length-1);
        }

        return ret;

    };

})();


var parseBlock = createDelimitParser( "{", "}" );
var parseExpression = createDelimitParser( "(", ")" );


function tryParseEscapeFnName( str ) {
    var ret = str.match( rescapekeyword );

    if( ret ) {
        return ret[1];
    }

    return null;
}





function consumeTemplateExpression() {
    var escapeFnName = tryParseEscapeFnName(input.substr(i, 12)),
        escapeFn = getEscapeFnByName(escapeFnName);

    if( escapeFnName ) {
        i += escapeFnName.length + 1;
    }

    var character = input.charAt(i++), identifier, ret = "", lastChar;

        if( character === "{" ) {
            return [BLOCK, parseBlock()]; // @{ literal code block  }
        }
        else if( character === "(" ) {
            return [EXPRESSION, parseExpression(), LONG_EXPRESSION, escapeFn]; // @( expression code result pushed to output )
        }
        else {
            i--; //Backtrack since the character is meaningful
            identifier = parseSimpleExpression();

            if( identifier === "@" ) {
                return [STRING, identifier];
            }

            if( keywords[identifier] !== true ) { // @someidentifier or @somefunctoion() etc
                skipNewLineAndIndentation()
                return [EXPRESSION, identifier, SHORT_EXPRESSION, escapeFn];
            }

            if( inlineKeywords[identifier] === true ) {
                skipNewLineAndIndentation()
                return [KEYWORD_EXPRESSION, identifier, SHORT_EXPRESSION];
            }

            
            if( identifier === "else" ) {
                var lookForIf = isNextWord("if"); //=D
                if( lookForIf ) {
                    identifier = "else if";
                }
            }
            else if( identifier === "for" ) {
                identifier = "foreach";
            }
            //Todo Syntax error fest here when output doesn't match
            while( character = input.charAt(i++) ) { // @while( true ) { and so on special blocks

                if( lookForIf && 
                    character === "f" &&
                    lastChar === "i" ) {
                    lookForIf = false;
                    ret = "";                
                }
                
                if( character === "{" ) {
                    skipWhiteSpace();
                    break;        
                }

                ret += character;
                lastChar = character;
  
            }

            return [KEYWORD_BLOCK_OPEN, ret, identifier];  
        }
}

function forceNextChar( character ) {
    nextCharForced = character;
}

function getNextToken() {
    var val = "",
        character;

    if( nextCharForced !== null ) {
        character = nextCharForced;
        escapingNext = false;
        nextCharForced = null;
    }
    else {
        character = input.charAt(i++);
    }

    if( character === "" ) {
        return [END_OF_INPUT, ""];
    }
    else if( escapingNext || specials[character] !== true ) {
        escapingNext = false;
        return [STRING, character + consumeUntilSpecial()];
    }
    else if( character === "\\" ) {
        escapingNext = true;
        return getNextToken();
    }
    else if( character === "@" ) {
        return consumeTemplateExpression();
    }
    else if( character === "}" ) {
        return [KEYWORD_BLOCK_CLOSE, character];
    }


}

function init( inp ) {   
    i = 0;
    output = [];
    helpers = [];
    keywordBlockStack = [];
    blockType = null;
    character = "";
    scope = TEMPLATE_SCOPE;
    auxI = 0;
    token = null;
    type = null;
    value = null;
    input = (inp + "").replace(/\r\n|\r/g, "\n");
    escapingNext = false;
    nextCharForced = null;
    htmlContextParser = new HtmlContextParser();

    var foreachStatement = function(last) {                
        return last && typeof last !== "string" && last instanceof ForeachStatement && last || null;
    };

    output.push = function( arg ) {
        var obj = this;

        if( scope !== TEMPLATE_SCOPE ) {
            obj = helpers;
        }

        var last = foreachStatement(obj[obj.length-1]);

        if( last ) {
            arg = foreachStatement(arg);
            if( arg ) {
                __push.call( obj, arg );
                return;
            }
            last.push.apply( last, arguments );
        }
        else {
            __push.apply( obj, arguments );
        }
    };    
}

function inLoopingConstruct() {
    for( var i = 0; i < keywordBlockStack.length; ++i ) {
        if( loopKeywords[keywordBlockStack[i]] === true ) {
            return true;
        }
    }
    return false;
}

function merge(src, dst) {
    for( var key in src ) { if( src.hasOwnProperty(key) ) {
        dst[key] = src[key];
    }}
}

function parse( inp ) {
    var r, matchExport, exportsAs, matchImport, 
        idName = "___template___", helperNames = {}, declaredVars = {},
        startIndex, booleanBlock = false;

    rimport.lastIndex = 0;
    rexport.lastIndex = 0;

    init( inp );

    matchExport = input.match( rexport ) || [];

    if( matchExport[1] && !exported.hasOwnProperty( matchExport[1] ) ) {
        exportsAs = matchExport[1];
        matchExport = true;
    }
    else {
        exportsAs = "CompiledTemplate";
    }

    while( ( matchImport = rimport.exec( input ) ) ) {

        if( !exported.hasOwnProperty( matchImport[1] ) ) {
            doError( "Cannot import '" + matchImport[1] + "' , no template has been exported with that name.", rimport.lastIndex - matchImport[0].length );
        }

        var exportObj = exported[matchImport[1]],
            code = exportObj.code,
            helperCode = exportObj.helperCode || "",
            name = matchImport[2] || matchImport[1];

        if( helperNames[name] === true ) {
            doError( "Cannot import as '"+name+"' - a helper with that name already exists.");
        }

        helpers.push( "var "+ name + " = (function(){ " + helperCode + "; " + code + "})();" );
        helperNames[name] = true;
    }

    rimport.lastIndex = 0;

    input = input.replace( rimport, "" ).replace( rexport, "" );

    endReturn = " return ___html.join('');}; return function "+exportsAs+"(___model) { return "+idName+".call((this == ___global ? ___model : this), ___model); };";

    skipWhiteSpace();
    while( true ) {
        startIndex = i;
        token = getNextToken();

        type = token[0];
        value = token[1];
        blockType = token[2] || null;
        escapeFn = token[3] || null;


        if( type === END_OF_INPUT ) {
            break;
        }

        if( type === KEYWORD_EXPRESSION ) {
            if( !inLoopingConstruct() ) {
                doError( "Cannot use continue or break while not in a loop.");
            }
            output.push( value + ";" );
        }
        else if( type === KEYWORD_BLOCK_OPEN ) {
            keywordBlockStack.push( blockType );
            htmlContextParser = htmlContextParser.pushStack();
            if( blockType === "helper" ) {

                if( keywordBlockStack.length > 1 ) {
                    doError( "Cannot define helper inside another block." );
                }

                if( scope !== TEMPLATE_SCOPE ) {
                    doError( "Nested helper functions are not supported.");
                }

                scope = HELPER_SCOPE;
                var helperHeader = value.trim().replace( "helper", "" ),
                    helperName = helperHeader.substring(0, helperHeader.indexOf("("));

                if( !helperName ) {//TODO JSIDENT
                    doError( "No name given for helper." );
                }

                if( helperNames[helperName] === true ) {
                    doError( "Cannot use '"+helperName+"', for a helper name - a helper with that name already exists.");
                }

                helperNames[helperName] = true;

                output.push( "function " + helperHeader + " { var ___html = [];" );
            }
            else if( blockType === "foreach" ) {
                var exprTree = parser.parse( "foreach " + value);
                output.push( exprTree );
            }
            else if( blockType === "else" ) {
                    output.push( "else {"+ value );
            }
            else {
                if( blockType === "if" || 
                    blockType === "else if" ) {
                    booleanBlock = true;
                }
                else {
                    booleanBlock = false;
                }

                var exprTree = parser.parse(value);
                merge( exprTree.getNakedVarReferences(), declaredVars );

                value = booleanBlock ? '___boolOp(' + exprTree.toString() + ')' : exprTree.toString();


                output.push( blockType + "(" + value + ") {"  );
                
            }
        }
        else if( type === KEYWORD_BLOCK_CLOSE ) {
            blockType = keywordBlockStack.pop();
            htmlContextParser = htmlContextParser.popStack();
            
            if( !blockType ) {
                output.push( "___html.push('}');" );
                continue;
            }
            skipWhiteSpace(); //Skip whitespace after block
            if( blockType === "foreach" ) {
                if( scope === TEMPLATE_SCOPE ) {
                    output.push( output.pop().toString() );
                }
                else {
                    output.push( helpers.pop().toString() );
                }
                continue;
            }

                                            //When closing a if|else if block, the next word could be another without @ prefix
            if( ( blockType === "if" || blockType === "else if" ) && isNextWord( "else" ) ) {
                i = input.indexOf( "else", i-1 ); //fast forward to the part where else begins
                forceNextChar( "@" ); //insert @ at that part
            }

            if( blockType === "helper" ) {
                output.push( "return ___html.join('');}");
                scope = TEMPLATE_SCOPE;
            }
            else {
                output.push( "}" );
            }

        }
        else if( type === STRING ) {
            htmlContextParser.write( value, i - value.length );
            
            if( lookahead(1) === "" ) { //Trim trailing whitespace when at the end
                value = trimRight(value);
            }
            else if( keywordBlockStack.length ) {
                    if( isWhiteSpace( value ) ) {
                        continue;
                    }
                    else if( lookahead(1) === "}" ) { //Trim whitespace before closing block
                        value = trimRight(value);
                    }
            }
            else if( isBlockAheadForWhiteSpaceTrim() ) {
                value = trimRight(value);
            }
            
            if( !value.length ) { //See if there is anything after possible trims
                continue;
            }
            //Make it safe to embed in a javascript string literal
            value = value.replace( rescapequote, "\\$1" ).replace( rlineterminator, lineterminatorReplacer );
            

            output.push( "___html.push('" + value +"');" );
            
        }
        else if( type === EXPRESSION ) {
            var exprTree = parser.parse(value);
            merge( exprTree.getNakedVarReferences(), declaredVars );
            
            if( exprTree.expr instanceof FunctionCall && 
                helperNames.hasOwnProperty(exprTree.expr.getDirectRefName())
            ) {
                escapeFn = "NO_ESCAPE";
            }
            
            output.push( 
                "___html.push(___safeString__(("+exprTree.toString()+"), '"+
                (   escapeFn === "NO_ESCAPE" ? escapeFn : htmlContextParser.getEscapeFunction() )
                +"'));"
            );
        }
        else if( type === BLOCK ) {
            output.push( value ); //literal javascript block of code
        }
    }
    htmlContextParser.close();

    if( keywordBlockStack.length ) {
        doError( "Unclosed '"+keywordBlockStack.pop()+"'-block. ");
    }
    
    var globalDeclarations = [],
        globalDeclarationCode,
        possibleGlobal,
        scopeDeclarations = [];
    
    for( var key in declaredVars ) { 
        if( declaredVars.hasOwnProperty(key) && !helperNames.hasOwnProperty(key) ) {
            if( ( possibleGlobal = globalsAvailable.hasOwnProperty(key) ) ) {
                globalDeclarations.push("____"+key + " = ___global." + key);
            }

            scopeDeclarations.push(key + " = (___hasown.call(___model, '"+key+"' ) ? ___model."+key+":"+
                "___hasown.call(this, '"+key+"' ) ? this."+key+":"+
                ( possibleGlobal ? "____"+key : 'null') + ")");
        }
    }

    var preReturn = "; function "+idName+"( ___model ) { var ___html = []; ___model = typeof ___model == \"object\" ? (___model || {}) : {};" +
        (scopeDeclarations.length ? (("var " + scopeDeclarations.join(", \n") + ";")) : "");
        
    globalDeclarationCode = 'var ___global = Function("return this")(); ' + (globalDeclarations.length ? ("var " + globalDeclarations.join(", \n") + ";") : "");

    helpers = helpers.join("");
    output = output.join("");
    
    if( matchExport === true ) {
        exported[exportsAs] = {
            code: preReturn + output + endReturn,
            helperCode: globalDeclarationCode + helpers
        };

    }
    
    output = globalDeclarationCode + fnBody + helpers + preReturn + output + endReturn;
    try {
        r = new Function( output )();
    }
    catch(e) {
        global.console && console.log( output );

        throw e;
    }

    r.extract = (function(o) {
        return function(templateName) {
            return "var "+templateName+" = (function() { " + o + "})();";            
        };
    })(output);
    return r;
}