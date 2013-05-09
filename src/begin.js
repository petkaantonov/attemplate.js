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
    var TemplateExpressionParser = parser;
    
    //The jison parser only parses small snippets at a time and has no knowledge of the big picture indices
    TemplateExpressionParser.parse = (function( old ) {
        return function( input, index, delimiter ) {
            this.yy.delimiter = delimiter;
            this.yy.templateParserIndex = index;
            return old.apply( this, arguments );
        };
    })( parser.parse );
    
    TemplateExpressionParser.yy.parseError = function( str, hash ) {
        console.log( str, hash );
        var token;
        var index = this.lexer.offset - hash.text.length + this.yy.templateParserIndex;
        if( hash.token === "EOF" ) {
            token = this.yy.delimiter;
            if( !token ) token = "EOF";
        }
        else {
            token = hash.text;
        }
        doError("Unexpected token '"+token+"'.", index);
    };
    
    TemplateExpressionParser.lexer.options.ranges = true;
        
    TemplateExpressionParser.lexer.parseError = function( str, hash ) {
        doError( "Unrecognized text", this.lexer.offset + this.yy.templateParserIndex );
    };
    
    