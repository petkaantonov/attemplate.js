var fs = require("fs");
var parsergen = require("./src/parsergen.js");
function stringifyClosureBody( code ) {
    code = code.replace( /\\/g, "\\\\").replace(/"/g, '\\"').replace(/(\r\n|\r|\n)/g, "\\n");
    return 'var programInitBody = "' + code + '";\n';
}

module.exports = function( grunt ) {

    var gruntConfig = {
        pkg: grunt.file.readJSON("package.json"),
    
        build: {

            src: [
                "./src/begin.js",
                "./src/runtime.js",
                "./src/macros.js",
                "./src/nodes/program_element.js",
                "./src/nodes/identifier.js",
                "./src/nodes/snippet.js",
                "./src/nodes/output_expression.js",
                "./src/nodes/combined_output_expression.js",
                "./src/nodes/call_expression.js",
                "./src/nodes/member_expression.js",
                "./src/nodes/function_call.js",
                "./src/nodes/operation.js",
                "./src/nodes/string_literal.js",
                "./src/nodes/array_literal.js",
                "./src/nodes/boolean_literal.js",
                "./src/nodes/numeric_literal.js",
                "./src/nodes/this_literal.js",
                "./src/nodes/null_literal.js",
                "./src/nodes/named_argument.js",
                "./src/nodes/range.js",
                
                "./src/nodes/block.js",
                "./src/nodes/header_block.js",
                "./src/nodes/scoped_block.js",
                "./src/nodes/foreach_block.js",
                "./src/nodes/helper_block.js",
                "./src/nodes/if_else_block.js",
                "./src/nodes/if_block.js",
                "./src/nodes/else_block.js",
                "./src/nodes/template_expression.js",
                "./src/nodes/literal_expression.js",
                "./src/nodes/literal_javascript_block.js",
                "./src/nodes/program.js",
                "./src/nodes/loop_statement.js",
                "./src/nodes/boolean_attribute_expression.js",
                
                "./src/html_context_parser.js",
                "./src/closure_body.js",
                "./src/template_parser.js",
                "./src/end.js"
            ],
            dest: './attemplate.js',
            minDest: './attemplate.min.js',
            separator: '\n'
            
        }
    };
    
    gruntConfig.watch = {
        scripts: {
            files: ["./src/*", "./src/nodes/*"],
            tasks: ['build', 'runtimeCode'],
            options: {
              interrupt: true,
              debounceDelay: 2500
            }
        }
    };

    grunt.initConfig(gruntConfig);
    
    var version = grunt.config("pkg.version");

    grunt.registerTask( "build", function() {
        var opts = grunt.config("build"),
            files = opts.src,
            dest = opts.dest,
            minDest = opts.minDest,
            separator = opts.separator;
        
        
        var compiled = [];
        compiled.push(parsergen("./js_template_expression_grammar.js"));
       
        files.forEach( function( filepath) {
            var contents = fs.readFileSync( filepath, "utf-8");
            if( filepath.indexOf("closure_body") > -1 ) {
                compiled.push(stringifyClosureBody(contents)); 
            }
            else {
                compiled.push(contents);
            }
        });
        
        
        compiled = compiled.join(separator).replace( /@VERSION/g, version );
        fs.writeFileSync( dest, compiled, "utf-8" );
        
    });
    
    grunt.registerTask( "runtimeCode", function() {
        var rtbegin = fs.readFileSync("./src/runtime_begin.js", "utf-8");
        var rt = fs.readFileSync("./src/runtime.js", "utf-8");
        var rtend = fs.readFileSync("./src/runtime_end.js", "utf-8");
       
        var compiled = (rtbegin + rt + rtend).replace( /@VERSION/g, version );
        fs.writeFileSync( './runtime.js', compiled, "utf-8" );
            
    });
    
    grunt.registerTask( "default", ["build", "runtimeCode"] );
    grunt.loadNpmTasks('grunt-contrib-watch');
};