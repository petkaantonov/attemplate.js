var compiledTemplates = {};
function trimRight( str ) {
    return str.replace(/\s\s*$/, "");
}

function getEscapeFnByName( name ) {
    switch( name ) {
        case "raw" : HtmlContextParser.context.NO_ESCAPE.name;
        default: return null;
    }
}

function boolOp( expr ) {
    if( expr.boolify ) {
        return expr.boolify();
    }
    else {
        return Operation.boolify( expr );
    }
}

/* global state */

var input,
    attrCloser,
    character,
    version = "@VERSION",
    i,
    blockStack,
    token,
    type,
    value,
    blockType,
    auxI,
    scopeBlock,
    parsed,
    endReturn,
    escapingNext = false,
    escapeFn,
    nextCharForced = null,
    htmlContextParser = null,

    exported = {},

    /* constants / helpers */
    
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
    
    ATTR_CLOSE = 11,

    rescapekeyword = /^(raw):/,
    rlineterminator = /[\n\r\u2028\u2029]+/g,
    rwhitespace = /\s/,
    rwscollapse = /\s+/g,
    rnltonewline = /\n\s*/g,
    rescapequote = /([\\'])/g,
    rwhitespaceonly = /^\s+$/,
    rexport = /(?:^|[^\\])@export\x20as\x20([A-Za-z$_][0-9A-Za-z$_]*)/,
    rimport = /(?:^|[^\\])@import\x20([A-Za-z$_][0-9A-Za-z$_]*)(?:\x20as\x20([A-Za-z$_][0-9A-Za-z$_]*))?/g,
    rprop = /(?:\[\s*(?:('(?:[^']|\\')*')|("(?:[^"]|\\")*")|([A-Za-z$_][0-9A-Za-z$_]*))\s*\]|\s*\.\s*([A-Za-z$_][0-9A-Za-z$_]*))/g,
    rkeyword = /^(?:undefined|NaN|Infinity|this|false|true|null|eval|arguments|break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with|class|enum|export|extends|import|super|implements|interface|let|package|private|protected|public|static|yield)$/,
    rtrailingattrname = /(?:([a-zA-Z0-9_-][a-zA-Z0-9_:-]*)\s*=\s*["'])$/g,
    rbooleanattr = /^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|ismap|declare|noresize|nowrap|noshade|compact|formnovalidate|reversed|muted|seamless|default|novalidate|open|typemustmatch|truespeed)$/,
    rinvalidref = /^(?:null|false|true|this)$/,
    rinvalidprop = /^"(?:charAt|charCodeAt|__proto__|prototype|getPrototypeOf|call|apply|constructor|__defineGetter__|__defineSetter__|__lookupGetter__|__lookupSetter__|valueOf|toString)"$/,
    rfalsetrue = /^(?:false|true)$/,
    rtripleunderscore = /^___/,
    rjsident = /^[a-zA-Z$_][a-zA-Z$_0-9]*$/,

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

//get the next len characters from current position + offset
function lookahead( len, offset ) { 
    offset = offset || 0;
    return len === 1 ? input.charAt(i + offset ) : input.substr( i + offset, len );
}

function skipWhiteSpace() {
    while( ( character = input.charAt( i++ ) ) ) {
        if( !isWhiteSpace( character ) ) {
            i--;
            break;
        }
    }
}

function validIdentifier( str ) {
    str = "" + str;
    return rjsident.test(str) && !rinvalidref.test(str) && !rkeyword.test(str)
}

/*skip whitespace if a dynamic expression is immediately followed by a new line and indentation*/
function skipNewLineAndIndentation() {
    var ahead = lookahead(1), wsCount = 0;
    if( rlineterminator.test(ahead) ) {
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
            if( specials[character] === true || character === attrCloser) {
                i--;
                break;
            }
            ret += character;
        }
    return ret;
}

//Return 1-based column index and the line for the 0-based index in the current input string
function getLineAndColumnByInputIndex( index ) {
    var index = index != null ? index : i, //Fallback to using the current index for usage by doError
        lines = input.split(/\n/g),
        lineno = -1,
        column = -1,
        last = 0,
        total = 0,
        line;

    if( lines.length <= 1 ) {
    
        column = index;
        line = lines[0];
        return {
            line: line,
            lineNumber: 1,
            column: column + 1
        }
    }

    for( var j = 0; j < lines.length; ++j ) {
        var len = lines[j].length;

        if( last <= index && index <= last + len ) {
            column = index - total;
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
    
    return {
        line: line,
        lineNumber: lineno,
        column: column + 1
    }
}

function doError( msg, currentIndex ) {
    var info = getLineAndColumnByInputIndex( currentIndex );
    var e = new Error( msg + " On line " + info.lineNumber  + ", column " + (info.column) +": " + info.line );
    e.lineNumber = info.lineNumber;
    e.column = info.column;
    e.line = info.line;
    throw e;
}

//TODO use a parser for this too ?
var parseHelperHeader = (function() {

    var rhelpername = /\s*([A-Za-z$_][0-9A-Za-z$_]*)/,
        rargssplit = /\s*,\s*/,
        rhelperargs = /\(([^)]*)\)/g;

    return function ( header, startIndex ) {
        var name = rhelpername.exec( header ) || doError("Helper name must be a valid Javascript identifier.", startIndex),
            argString,
            len,
            args = [],
            uniqueArgs = {};

        startIndex += name[0].length;
        name = name[1];

        new Identifier( name ).setStartIndex( startIndex ).checkValid();
        
        rhelperargs.lastIndex = 0;
        argString = rhelperargs.exec( header ) || doError("Invalid helper syntax for arguments.", startIndex);
        startIndex = rhelperargs.lastIndex - argString[0].length;
        args = argString[1].split( rargssplit );

        if( ( len = args.length ) ) {

            for( var i = 0; i < len; ++i ) {
                startIndex += args[i].length;
                var arg = args[i].trim();
                
                if( !arg ) {
                    continue;
                }
                
                new Identifier( arg ).setStartIndex( startIndex ).checkValid();
                                
                if( uniqueArgs.hasOwnProperty( args ) ) {
                    doError( "Duplicate helper parameter name, '"+arg+"' was already declared.", startIndex );
                }
                uniqueArgs[arg] = true;
                args[i] = arg;
            }            
        }
        
        return {
            args: args,
            name: name
        };

    };

})();

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
    rsimplecontinuation = /[\[\(\.]/,
    rnumeric = /[0-9]/;

//Try to make a sense of undelimited simple @expr 
//ideally the part where the expression starts to become invalid
//is directly output and if there is a valid full expression, it becomes
//a dynamic one

//So for instance @asd.123 outputs value of variable 'asd' and then literally '.123'
//@asd.a123 outputs property 'a123' of the variable 'asd'
//@123 directly outputs '@123' statically and so on.
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
                    else if( rnumeric.test(character) ) {
                        i--;
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
                    else if( character === "{" ) {
                        try {
                            var block = parseBlock();
                            ret += block;
                        }
                        catch( e ) {
                            break loop;
                        }
                        lastChar = "}";
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
                        //It was never in the stack @aosdkasd[ ok okasd odsa da do dkos ) -> aosdkasd becomes id and [ ok okasd odsa da do dkos ) becomes html
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
        
        //@ was at end of file
        if( !ret.length && !character ) {
            return "@";
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
    
    var originalIndex = i,
        character = input.charAt(i++), identifier, ret = "", lastChar;

        if( character === "{" ) {
            var ret = parseBlock();
            if( !ret || rwhitespaceonly.test(ret) ) {
                return [STRING, "@{"+ret+"}", null, null, originalIndex - 1];
            }
            return [BLOCK, ret, null, null, originalIndex + 1]; // @{ literal code block  }
        }
        else if( character === "(" ) {
            var ret = parseExpression();
            if( !ret || rwhitespaceonly.test(ret) ) {
                return [STRING, "@("+ret+")", null, null, originalIndex - 1];
            }
            return [EXPRESSION, ret, LONG_EXPRESSION, escapeFn, originalIndex + 1]; // @( expression code result pushed to output )
        }
        else {
            i--; //Backtrack since the character is meaningful
            identifier = parseSimpleExpression();

            if( identifier === "@" ) {
                return [STRING, identifier, null, null, originalIndex - 1];
            }

            if( keywords[identifier] !== true ) { // @someidentifier or @somefunctoion() etc
                skipNewLineAndIndentation()
                return [EXPRESSION, identifier, SHORT_EXPRESSION, escapeFn, originalIndex];
            }

            if( inlineKeywords[identifier] === true ) {
                skipNewLineAndIndentation()
                return [KEYWORD_EXPRESSION, identifier, SHORT_EXPRESSION, null, originalIndex];
            }

            if( identifier === "else" ) {
                var lookForIf = isNextWord("if");
                if( lookForIf ) {
                    identifier = "else if";
                }
            }
            var wsBeforeParen = "",
                parenFound = (identifier === "for" || identifier === "foreach" ? false : true);
            //Todo Syntax error fest here when output doesn't match
            while( character = input.charAt(i++) ) {
                if( !parenFound ) {
                    if( isWhiteSpace( character ) ) {
                        wsBeforeParen += character;
                    }
                    else if( character === "(" ) {
                        parenFound = true;
                    }
                    else {
                        doError( "Expecting '(', got '"+character+"'." );
                    }
                }
                if( lookForIf && 
                    character === "f" &&
                    lastChar === "i" ) {
                    lookForIf = false;
                    ret = "";
                    continue;
                }
                
                if( character === "{" ) {
                    skipWhiteSpace();
                    break;        
                }
                
                ret += character;
                lastChar = character;
                  
            }
            return [KEYWORD_BLOCK_OPEN, ret, identifier, null, 
                (identifier === "for" || identifier === "foreach" ? originalIndex : originalIndex + identifier.length ), wsBeforeParen ];  
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
    
    var startIndex = i-1;

    if( character === "" ) {
        return [END_OF_INPUT, "", null, null, startIndex];
    }
    else if( character === attrCloser ) {
        return [ATTR_CLOSE, character, null, null, startIndex];
    }
    else if( escapingNext || specials[character] !== true ) {
        escapingNext = false;
        return [STRING, character + consumeUntilSpecial(), null, null, startIndex];
    }
    else if( character === "\\" ) {
        escapingNext = true;
        return getNextToken();
    }
    else if( character === "@" ) {
        return consumeTemplateExpression();
    }
    else if( character === "}" ) {
        return [KEYWORD_BLOCK_CLOSE, character, null, null, startIndex];
    }


}

function init( inp ) {
    Program.cleanStaticState();
    i = 0;
    attrCloser = null;
    blockStack = [new Program()];
    blockType = null;
    character = "";
    auxI = 0;
    token = null;
    type = null;
    value = null;
    input = (inp + "").replace(/\r\n|\r/g, "\n");
    escapingNext = false;
    nextCharForced = null;
    htmlContextParser = new HtmlContextParser();
    setScopeBlock();
}

function setScopeBlock() {
    for( var l = blockStack.length-1; l >= 0; l-- ) {
        if( blockStack[l] instanceof ScopedBlock ) {
            scopeBlock = blockStack[l];
            break;
        }
    }
}

function inLoopingConstruct() {
    for( var i = 0; i < blockStack.length; ++i ) {
        if( blockStack[i] instanceof ForeachBlock ) {
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

function isImported( imports, helperName ) {
    for( var key in imports ) {
        if( imports.hasOwnProperty(key) ) {
            
            if( key === helperName ) {
                return true;
            }
            else if( imports[key] && imports[key].indexOf(helperName) > -1 ) {
                return true;
            }
            
        }
    }
    return false;
}

function getImports( importProgram, imports ) {    
    var helpers = importProgram.getHelpers(),
        helper,
        alias,
        name;
    
    for( var i = 0; i < helpers.length; ++i ) {
        helper = helpers[i];
        
        if( helper instanceof Program ) {
            name = helper.getImportName();
            
            if( imports.hasOwnProperty(name) ) {
                alias = helper.getAliasedImportName();
                if( alias ) {
                    imports[name].push( alias );
                }
            }
            else {
                imports[name] = [];
                getImports( helper, imports );
            }
        }
    }
    
    return imports;
    
}

function parse( inp, compiledName ) {
    if( compiledName && !validIdentifier( compiledName ) ) {
        throw new Error("Invalid javascript identifier for extraction: '" + compiledName+"'.");
    }

    var r, matchExport, matchImport, block,
        stackTop, stackLen,
        helpers = [], program, statements,  name, output,
        imports = {},
        statement,
        prevType,
        startIndex;

    rimport.lastIndex = 0;
    rexport.lastIndex = 0;

    init( inp );
    
    program = blockStack[blockStack.length-1];

    while( ( matchImport = rimport.exec( input ) ) ) {

        if( !exported.hasOwnProperty( matchImport[1] ) ) {
            doError( "Cannot import '" + matchImport[1] + "' , no template has been exported with that name.", rimport.lastIndex - matchImport[0].length );
        }
        var alias = matchImport[2],
            importedProgram,
            name = matchImport[1];

        if( imports.hasOwnProperty( name ) ) {
            doError( "Cannot import the template '"+name+"' more than once in a single template." );
        }
        else {
            imports[name] = [];
            
            if( alias ) {
                imports[name].push( alias );
            }
        }
        
        importedProgram = exported[name].asHelper( name, alias );
        helpers.push( importedProgram );
        
    }
    
    for( var j = 0; j < helpers.length; ++j ) {
        getImports( helpers[j], imports );
    }
    
    matchExport = input.match( rexport ) || [];
    
    

    if( matchExport[1] && !exported.hasOwnProperty( matchExport[1] ) ) {
        exported[matchExport[1]] = program;
    }

    rimport.lastIndex = 0;
    rexport.lastIndex = 0;

    input = input.replace( rimport, "" ).replace( rexport, "" );


    skipWhiteSpace();
    
    
    
    
    while( true ) {
        stackLen = blockStack.length;
        stackTop = blockStack[stackLen-1];
        token = getNextToken();

        type = token[0];
        value = token[1];
        blockType = token[2] || null;
        escapeFn = token[3] || null;
        startIndex = token[4];
   
        //TODO remove this for "production"
        if( value !== input.substr(startIndex, value.length) ) {
            if( blockType === "for" || blockType === "foreach" ) {
                if( (blockType + token[5] + value ) !== input.substr(startIndex,  (blockType + token[5] + value ).length ) ) {
                    console.log("current:", i, "start:", startIndex, "value:", (blockType + token[5] + value ), "substr:", input.substr(startIndex,  (blockType + token[5] + value ).length ));
                }
            }
            else {
                console.log("current:", i, "start:",startIndex, "value:", value, "substr:", input.substr(startIndex, value.length));
            }
        }
        
        
        if( type === END_OF_INPUT ) {
            break;
        }

        if( type === KEYWORD_EXPRESSION ) {
            if( !inLoopingConstruct() ) {
                doError( "Cannot use continue or break while not in a loop.");
            }
            stackTop.push( new LoopStatement( value ) );
        }
        else if( type === ATTR_CLOSE ) {
            htmlContextParser.write( attrCloser, i-1 );
            attrCloser = null;
            block = blockStack.pop();
            stackLen = blockStack.length;
            stackTop = blockStack[stackLen-1];
            stackTop.push(block);
            
        }
        else if( type === KEYWORD_BLOCK_OPEN ) {

            if( blockType === "helper" ) {
                if( stackLen > 1 ) {
                    doError( "Cannot define helper inside another block.", startIndex );
                }

                var parsedHeader = parseHelperHeader(value, startIndex ),
                    helperArgs = parsedHeader.args,
                    helperName = parsedHeader.name;

                if( isImported( imports, helperName ) ) {
                    doError( "Cannot use '"+helperName+"', for a helper name - a helper or an import with that name already exists.", startIndex);
                }

                imports[helperName] = null;
                stackTop = new HelperBlock( helperName, helperArgs ).setStartIndex( startIndex ) ;
                blockStack.push( stackTop );
                setScopeBlock();
                htmlContextParser = htmlContextParser.pushStack();
            }
            else if( blockType === "foreach" || blockType === "for" ) {
                var snippet = TemplateExpressionParser.parse( blockType + token[5] + value, startIndex, ")" );
                scopeBlock.mergeVariables( snippet.getNakedVarReferences() );
                stackTop = snippet.getExpression().setStartIndex( startIndex );
                blockStack.push( stackTop );
            }
            else if( blockType === "else" ) {
                stackTop = new ElseBlock().setStartIndex( startIndex );
                blockStack.push( stackTop );
            }
            else {
                var snippet = TemplateExpressionParser.parse(value, startIndex, ")");

                switch( blockType ) {
                    case "if": stackTop = new IfBlock( snippet.getExpression() ); break;
                    case "else if": stackTop = new IfElseBlock( snippet.getExpression() ); break;
                }
                
                scopeBlock.mergeVariables( snippet.getNakedVarReferences() );
                blockStack.push( stackTop.setStartIndex( startIndex ) );
                
            }
        }
        else if( type === KEYWORD_BLOCK_CLOSE ) {
            if( stackTop instanceof Program ) {
                //No block is open so just output } as literal
                stackTop.push( new LiteralExpression( "}" ) );
                continue;
            }
            
            block = blockStack.pop();
            stackLen = blockStack.length;
            stackTop = blockStack[stackLen-1];
            stackTop.push(block.setEndIndex( startIndex ) );
            
            setScopeBlock();
            
            //Remove reference error guards from current scope for the vars that the block defines
            if( block.definesVars ) {
                scopeBlock.unmergeVariables( block.definesVars() );
            }
            
            skipWhiteSpace(); //Skip whitespace after block

                                            //When closing a if|else if block, the next word could be another without @ prefix
            if( ( block instanceof IfBlock || block instanceof IfElseBlock ) && isNextWord( "else" ) ) {
                i = input.indexOf( "else", i-1 ); //fast forward to the part where else begins
                forceNextChar( "@" ); //insert @ at that part
            }
            else if( block instanceof ScopedBlock ) {
                htmlContextParser = htmlContextParser.popStack();
            }
        }
        else if( type === STRING ) {
            var valueLastChar = value.charAt(value.length - 1 ),
                attrName;
                
            //Because there is currently no object model for html, the string is backtracked
            //and possibly reparsed for boolean attributes here
            if( !attrCloser && (valueLastChar === doubleQuote || valueLastChar === singleQuote) ) {
                rtrailingattrname.lastIndex = 0;
                
                var trailAttrMatch = rtrailingattrname.exec( value );
                
                if( trailAttrMatch && rbooleanattr.exec( ( attrName = trailAttrMatch[1] ).toLowerCase() ) ) {
                    var fullMatch = trailAttrMatch[0],
                        tmp = htmlContextParser.clone(), //Save the context for recovery
                        matchIndex = rtrailingattrname.lastIndex - trailAttrMatch[0].length;
                        
                    value = value.substring(0, matchIndex);
                    
                    htmlContextParser.write( value, i - fullMatch.length );
                    //Only if the html context is waiting for attribute does it count as a boolean attribute
                    if( htmlContextParser.isWaitingForAttr() ) {
                        htmlContextParser.write( fullMatch, startIndex );
                        stackTop.push(
                            new LiteralExpression( value )
                            .setStartIndex( startIndex )
                            .setEndIndex( startIndex + value.length ) 
                        );
                        blockStack.push( new BooleanAttributeExpression( attrName, valueLastChar ) );
                        attrCloser = valueLastChar;
                        continue;
                    }
                    else {
                        //Restore value and continue normally
                        value = value + fullMatch;
                        htmlContextParser = tmp;
                    }
                }
            }
        
            htmlContextParser.write( value, startIndex );
            
            
            if( lookahead(1) === "" ||//Trim trailing whitespace when at EOF (the last string in the file)
                (blockStack.length > 1 && lookahead(1) === "}") || //Trim whitespace before closing block
                (isBlockAheadForWhiteSpaceTrim() && (prevType === BLOCK || prevType === KEYWORD_BLOCK_CLOSE)) //Ignore whitespace between consecutive blocks
                    
            ) { 
                value = trimRight(value);
            }

            if( !value.length ) { //See if there is anything after possible trims
                continue;
            }
            
            stackTop.push( new LiteralExpression( value ).setStartIndex( startIndex ).setEndIndex( i - 1 ) );            
        }
        else if( type === EXPRESSION ) {
            var snippet = TemplateExpressionParser.parse( value, startIndex, blockType === LONG_EXPRESSION ? ")" : lookahead(1) );
            scopeBlock.mergeVariables( snippet.getNakedVarReferences() );
            
            
            //Expression is giving attribute name dynamically, escape context needs to be determined at run-time
            if( htmlContextParser.isWaitingForAttr() && lookahead(1) === "=") {
                var quote = lookahead(1, 1);
                
                if( quote === doubleQuote || quote === singleQuote ) {
                    var expr = snippet.getExpression();

                    stackTop.push(
                        new TemplateExpression(
                            expr,
                            htmlContextParser.getContext(),
                            escapeFn
                        ).setStartIndex( startIndex ).setEndIndex( i - 1 )
                    );

                    htmlContextParser.dynamicAttribute( expr, quote );

                    i+=2;

                    stackTop.push( new LiteralExpression( "=" + quote ) );
                    
                    continue;
                }
            }
            
            stackTop.push(
                new TemplateExpression(
                    snippet.getExpression(),
                    htmlContextParser.getContext(),
                    escapeFn
                ).setStartIndex( startIndex ).setEndIndex( i - 1 )
            );
            
        }
        else if( type === BLOCK ) {
            stackTop.push( new LiteralJavascriptBlock( value ) ); //literal javascript block of code
        }
        prevType = type;
    }
    htmlContextParser.close();

    if( stackLen > 1 ) { //Todo block name
        stackTop.raiseError( "Unclosed block. ");
    }
    

    program = stackTop;
    statements = program.getStatements();
        
    
    for( var j = 0; j < statements.length; ++j ) {
        statement = statements[j];
        
        if( statement instanceof HelperBlock || 
            statement instanceof Program ) {
            
            helpers.push( statement );
            statements.splice(j--, 1);
        }
    }
    
    for( var j = 0; j < helpers.length; ++j ) {
        var helper = helpers[j];
        //Helpers need to know about other helpers as well
        //So that they don't declare variables that refer to helpers

        if( helper instanceof HelperBlock ) {
            helper.setHelpers(helpers);
        }
    }
    //This is why in the above loop we don't need to check for instanceof Program
    program.setHelpers( helpers );
    
    
    program.performAnalysis();
    program.setIndentLevel(1);
    
    
    
    output = program.toString( imports, exported );
    

    
    if( compiledName ) {
        r = "var "+compiledName+" = (function() {\n" + output + "\n})();";
        r += "\n" + compiledName + ".registerRuntime(new Runtime('"+version+"'));";
    }
    else {
        try {
            r = new Function( output )();
        }
        catch(e) {
            global.console && console.log( output );

            throw e;
        }
        r.registerRuntime(new Runtime(version));
    }

    return r;
}