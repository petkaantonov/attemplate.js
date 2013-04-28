//String literals must not have line terminators

var grammar = {

    snippet: [
        ["", "return $$ = new Snippet();"],
        ["EOF", "return $$ = new Snippet();"],
        ["body EOF", "return $$ = $1;"]
        
    ],
    
    body: [
        ["foreach", "$$ = new Snippet($1);"],
        ["expression", "$$ = new Snippet($1);"],
        
        
    ],
    
    expression: [
        ["member"],
        ["functionCall"],
        ["operation"],
        ["template"]
    ],
    
    template: [
        ["{", "$$ = new InlineTemplateParser();"]
    ],
    
    functionCall: [
        ["member args", "$$ = new FunctionCall($1, $2);"],
        ["functionCall args", "$$ = new FunctionCall($1, $2);"],
        ["functionCall [ expression ]", "$$ = new CallExpression($1, $3);" ],
        ["functionCall . identifier", "$$ = new CallExpression($1, '\"' + $3 + '\"');"]
    ],

    args: [
        ["( )", "$$ = [];"],
        ["( argList optComma )", "$$ = $2;"]
    ],

    argList: [
        ["arg", "$$ = [$1];"],
        ["argList , arg", "$$ = $1.concat($3);"]
    ],
    
    arg: [
        ["identifier : expression", "$$ = new NamedArgument($1, $3);"],
        ["string : expression", "$$ = new NamedArgument($1, $3);"],
        ["number : expression", "$$ = new NamedArgument($1, $3);"],
        ["expression"]
    ],
    
    optComma: [
        [""],
        [","]
    ],
    
    elision: [
        [","],
        ["elision ,"]
    ],
    
    optElision: [
        [""],
        ["elision"]
    ],
    
    member: [
        ["memberExpression", "$$ = new MemberExpression($1);"]
    ],
    
    memberExpression: [
        ["primary", "$$ = [$1];"],
        ["memberExpression . identifier", "$$ = $1.concat('\"' + $3 + '\"');"],
        ["memberExpression [ expression ]", "$$ = $1.concat($3);"]
    ],
            
    primary: [
        ["literal"],
        ["array"],
        ["identifier"],
        ["( expression )", "$$ = $2;"]
    ],
    
    literal: [
        ["NULL"],
        ["BOOLEAN"],
        ["number"],
        ["string"]
    ],
    
    operation: [
        ["UNARY expression", "$$ = new Operation($1, $2, null);"],
        ["- expression", "$$ = new Operation($1, $2, null);", {prec: "UNARY"}],
        ["+ expression", "$$ = new Operation($1, $2, null);", {prec: "UNARY"}],
        ["expression IN expression", "$$ = new Operation($2, $1, $3);"],
        ["expression MATH expression", "$$ = new Operation($2, $1, $3);"],
        ["expression RELATION expression", "$$ = new Operation($2, $1, $3);"],
        ["expression EQUALITY expression", "$$ = new Operation($2, $1, $3);"],
        ["expression && expression", "$$ = new Operation($2, $1, $3);"],
        ["expression || expression", "$$ = new Operation($2, $1, $3);"],
        ["expression + expression", "$$ = new Operation($2, $1, $3);"],
        ["expression - expression", "$$ = new Operation($2, $1, $3);"],
        ["expression ? expression : expression", "$$ = new Operation($1, $3, $5, true);"]
    ],
    
    optSign: [
        [""],
        ["+"],
        ["-"]
    ],
    
    foreach: [
        ["FOREACH ( member )", "$$ = new ForeachBlock(null, null, $3);"],
        ["FOREACH ( identifier IN range )", "$$ = new ForeachBlock($3, null, $5);"],
        ["FOREACH ( identifier IN expression )", "$$ = new ForeachBlock($3, null, $5);"],
        ["FOREACH ( identifier , identifier IN expression )", "$$ = new ForeachBlock($3, $5, $7);"]
    ],
    
    range: [
        ["| expression ARROW expression |", "$$ = new Range($2, $4);" ],
        ["| expression ARROW expression | expression", "$$ = new Range($2, $4, $5);" ]
    ],
    
    array: [
        ["[ optElision ]", "$$ = new ArrayLiteral([]);"],
        ["[ elementList ]", "$$ = new ArrayLiteral($2);"],
        ["[ elementList , optElision ]", "$$ = new ArrayLiteral($2);" ]
    ],
    
    elementList: [
        ["optElision expression", "$$ = [$2];"],
        ["elementList , optElision expression", "$$ = $1.concat($4);"]
    ],
    
    identifier: [
        ["IDENTIFIER"]
    ],
       
    string: [
        ["STRING", "$$ = new StringLiteral($1);"]
    ],
    

    number: [
        ["decimal"],
        ["hex"]
    ],
    
    decimal: [
        ["integer AFTER", "$$ = $1 + $2;"],
        ["AFTER"],
        ["integer"]
    ],
    
    integer: [
        ["ZERO", "$$ = '0';"],
        ["DECIMAL"]
    ],
    
    hex: [
        ["HEX", "$$ = $1 + $2;"]
    ]
};

var operators = [
    ['left', '.', '[', ']'],
    ['left', '(', ')'],
    ['right',   'IN'],
    ['right',     'UNARY'],
    ['left',      'MATH'],
    ['left',      '+', '-'],
    ['left',      'RELATION'],
    ['left',      'EQUALITY'],
    ['left',      '&&'],
    ['left',      '||'],
    ['right',     '?', ':']
].reverse();

var tmp = {};
var tokens = [];

for( var key in grammar ) {
    var alternatives = grammar[key],
        results = [],
        alt;
    for( var i = 0; i < alternatives.length; ++i ) {
        alt = alternatives[i];
        try {
            if( alt.length === 1 ) {
                alt.push( "$$ = $1;" );
            }
        }
        catch( e ) {
            //Quickly find the missing comma in the above array literal hell
            console.log("Key: " + key);
            console.log("Index: " +i );
            throw new Error(e.message);
        }
        
        
        var terms = alt[0].split(" ");
        for( var j = 0; j < terms.length; ++j ) {
            var term = terms[j];
            if( !(term in grammar ) ) {
                tmp[term] = true;
            }
        }
        results.push(alt);
    }
    grammar[key] = results;
}

for( var key in tmp ) {
    tokens.push(key);
}

function delimited( token ) {

   return "if(yytext.charAt(yyleng-1) == '\\\\') {\
       this.more();\
   } else {\
       yytext += this.input();\
       return '"+token+"';\
   }";
}

var lex = {

    rules: [
        ["in\\b", "return 'IN';"],
        ["(?:foreach|for)\\b", "return 'FOREACH';"],
        ["0+\\b", "return 'ZERO';"],
        ["\\.[0-9]+\\b", "return 'AFTER';"],
        
        ["0[xX][a-fA-F0-9]+", "return 'HEX';"],
        ["[1-9][0-9]*\\b", "return 'DECIMAL';"],
        ["[0-9]+\\b", "return 'DIGITS';"],
        ["\\s+", "/* skip whitespace */"],
        ["\\ufeff", "/* skip boms */"],
        ["'[^']*", delimited("STRING")],
        ["\"[^\"]*", delimited("STRING")],
        ["null\\b", "return 'NULL';"],
        ["(?:true|false)\\b", "return 'BOOLEAN';"],
        ["(?:[a-zA-Z_$][a-zA-Z$_0-9]*)", "return 'IDENTIFIER';"],
        ["&&", "return '&&';"],
        [">=|<=|>|<", "return 'RELATION';"],
        ["\\|\\|", "return '||';"],
        ["===|!==|==|!=", "return 'EQUALITY';"],
        ["\\|", "return '|';"],
        ["\\)", "return ')';"],
        ["\\(", "return '(';"],
        ["\\[", "return '[';"],
        ["\\]", "return ']';"],
        [",", "return ',';"],
        ["\\?", "return '?'"],
        [":", "return ':'"],
        ["!", "return 'UNARY';"],
        ["\\->", "return 'ARROW';"],
        ["\\-", "return '-';"],
        ["\\+", "return '+';"],
        ["\\/|%|\\*", "return 'MATH';"],
        ["\\.", "return '.';"],
        
        ["$", "return 'EOF';"]
    ]
};

var opts = {
    tokens: tokens,
    bnf: grammar,
    operators: operators,
    startSymbol: "snippet",
    lex: lex

}

module.exports = opts;