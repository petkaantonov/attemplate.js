module.exports = function( grammarFile ) {

    var Parser = require("jison").Parser;
    var grammar = require( grammarFile || "./grammar.js");
    var fs = require("fs");

    var parser = new Parser(grammar);

    var parserSource = parser.generate();
    return parserSource;
};