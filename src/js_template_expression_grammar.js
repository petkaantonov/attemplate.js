//String literals must not have line terminators

var setIndex = "$$.setStartIndex((_$[_$.length-1].first_column) + yy.templateParserIndex);";

var grammar = {

    snippet: [
        ["", "return $$ = new yy.Snippet(); " + setIndex],
        ["EOF", "return $$ = new yy.Snippet(); " + setIndex],
        ["body EOF", "return $$ = $1;"]
        
    ],
    
    body: [
        ["foreach", "$$ = new yy.Snippet($1); " + setIndex],
        ["assignments", "$$ = new yy.Snippet($1); " + setIndex],
        ["expression", "$$ = new yy.Snippet($1); " + setIndex],
        
        
    ],
    
    assignments: [
        ["assignmentList", "$$ = new yy.AssignmentList($1); " + setIndex]
    ],
    
    assignmentList: [
        ["assignment", "$$ = [$1];"],
        ["assignmentList assignment", "$$ = $1.concat($3)"]
    ],
    
    assignment: [
        ["identifier = expression", "$$ = new yy.Assignment($1, $3); " + setIndex]
    ],
    
    expression: [
        ["member"],
        ["functionCall"],
        ["operation"],
        ["template"]
    ],
    
    template: [
        ["{", "yy.currentTemplateParser.parseInlineTemplate(); $$ = new MemberExpression([]); /*pass cursor, move cursor*/"]
    ],
    
    functionCall: [
        ["member args", "$$ = new yy.FunctionCall($1, $2); " + setIndex],
        ["functionCall args", "$$ = new yy.FunctionCall($1, $2); " + setIndex],
        ["functionCall [ expression ]", "$$ = new yy.CallExpression($1, $3); " + setIndex ],
        ["functionCall . propAccessLiteral", "$$ = new yy.CallExpression($1, $3); " + setIndex],
        ["functionCall . identifier", "$$ = new yy.CallExpression($1, $3); " + setIndex]
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
        ["literal : expression", "$$ = new yy.NamedArgument($1, $3); " + setIndex],
        ["identifier : expression", "$$ = new yy.NamedArgument($1, $3); " + setIndex],
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
        ["memberExpression", "$$ = new yy.MemberExpression($1); " + setIndex]
    ],
    
    memberExpression: [
        ["primary", "$$ = [$1];"],
        ["memberExpression . propAccessLiteral", "$$ = $1.concat($3);"],
        ["memberExpression . identifier", "$$ = $1.concat($3);"],
        ["memberExpression [ expression ]", "$$ = $1.concat($3);"]
    ],
            
    primary: [
        ["literal"],
        ["array"],
        ["identifier"],
        ["( expression )", "$$ = $2; $2.parens = true;"]
    ],
    
    literal: [
        ["this"],
        ["null"],
        ["boolean"],
        ["number"],
        ["string"]
    ],
    
    propAccessLiteral: [
        ["this"],
        ["null"],
        ["boolean"]
    ],
    
    operation: [
        ["UNARY expression", "$$ = new yy.Operation($1, $2, null); " + setIndex],
        ["- expression", "if( $2.isPureNumber && $2.isPureNumber() ) { $$ = $2; $$.identifier.flip(); } else{ $$ = new yy.Operation($1, $2, null);}; " + setIndex, {prec: "UNARY"}],
        ["+ expression", "if( $2.isPureNumber && $2.isPureNumber() ) { $$ = $2; } else{ $$ = new yy.Operation($1, $2, null); }; " + setIndex, {prec: "UNARY"}],
        ["expression IN expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression MATH expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression RELATION expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression EQUALITY expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression && expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression || expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression + expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression - expression", "$$ = new yy.Operation($2, $1, $3); " + setIndex],
        ["expression ? expression : expression", "$$ = new yy.Operation($1, $3, $5, true); " + setIndex]
    ],
    
    optSign: [
        [""],
        ["+"],
        ["-"]
    ],
    
    foreach: [
        ["FOREACH ( identifier range )", "$$ = new yy.ForeachBlock($3, null, $4); " + setIndex],
        ["FOREACH ( identifier IN expression )", "$$ = new yy.ForeachBlock($3, null, $5); " + setIndex],
        ["FOREACH ( identifier , identifier IN expression )", "$$ = new yy.ForeachBlock($3, $5, $7); " + setIndex]
    ],
    
    range: [
        ["FROM expression TO expression", "$$ = new yy.Range($2, $4); " + setIndex ],
        ["FROM expression TO expression BY expression", "$$ = new yy.Range($2, $4, $6); " + setIndex ]
    ],
    
    array: [
        ["[ optElision ]", "$$ = new yy.ArrayLiteral([]); " + setIndex],
        ["[ elementList ]", "$$ = new yy.ArrayLiteral($2); " + setIndex],
        ["[ elementList , optElision ]", "$$ = new yy.ArrayLiteral($2); " + setIndex ]
    ],
    
    elementList: [
        ["optElision expression", "$$ = [$2];"],
        ["elementList , optElision expression", "$$ = $1.concat($4);"]
    ],
    
    'this': [
        ["THIS", "$$ = new yy.ThisLiteral(); " + setIndex]
    ],
    
    'null': [
        ["NULL", "$$ = new yy.NullLiteral(); " + setIndex]
    ],
    
    'boolean': [
        ["BOOLEAN", "$$ = new yy.BooleanLiteral($1); " + setIndex]
    ],
    
    identifier: [
        ["IDENTIFIER", "$$ = new yy.Identifier($1); " + setIndex + ";" ]
    ],
       
    string: [
        ["STRING", "$$ = new yy.StringLiteral($1); " + setIndex]
    ],
    

    number: [
        ["decimal", "$$ = new yy.NumericLiteral($1); " + setIndex],
        ["hex", "$$ = new yy.NumericLiteral($1); " + setIndex]
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
        ["HEX"]
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
            throw new yy.Error(e.message);
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
        ["from\\b", "return 'FROM';"],
        ["by\\b", "return 'BY';"],
        ["to\\b", "return 'TO';"],
        ["(?:foreach|for)\\b", "return 'FOREACH';"],
        ["0+\\b", "return 'ZERO';"],
        ["\\.[0-9]+\\b", "return 'AFTER';"],
        
        ["0[xX][a-fA-F0-9]+", "return 'HEX';"],
        ["[1-9][0-9]*\\b", "return 'DECIMAL';"],
        ["[0-9]+\\b", "return 'DIGITS';"],
        ["\\s+", "/* skip whitespace */"],
        ["\\ufeff", "/* skip boms */"],
        ["'[^\\\\']*(?:\\\\.[^\\\\']*)*'", "return 'STRING';"],
        ['"[^\\\\"]*(?:\\\\.[^\\\\"]*)*"', "return 'STRING';"],
        ["null\\b", "return 'NULL';"],
        ["(?:true|false)\\b", "return 'BOOLEAN';"],
        ["this\\b", "return 'THIS';"],
        ["(?:[a-zA-Z_$][a-zA-Z$_0-9]*)", "return 'IDENTIFIER';"],
        ["&&", "return '&&';"],
        
        [">=|<=|>|<", "return 'RELATION';"],
        ["\\|\\|", "return '||';"],
        ["===|!==|==|!=", "return 'EQUALITY';"],
        ["=", "return '=';"],
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
        
        ["$", "return 'EOF';"],
        [".", "return 'UNEXPECTED';"]
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