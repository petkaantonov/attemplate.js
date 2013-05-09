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
                "./src/object.js",
                "./src/map.js",
                "./src/html_context_parser.js",
                "./src/runtime.js",
                "./src/macros.js",
                
                "./src/nodes/program_element.js",
                "./src/nodes/node.js",
                "./src/nodes/terminal_node.js",
                
                "./src/traversals/combiner.js",
                
                "./src/nodes/identifier.js",
                "./src/nodes/snippet.js",
                "./src/nodes/named_argument.js",
                "./src/nodes/range.js",
                "./src/nodes/literal_javascript_block.js",
                "./src/nodes/loop_statement.js",

                
                "./src/nodes/output/output_expression.js",
                "./src/nodes/output/combined_output_expression.js",
                "./src/nodes/output/template_expression.js",
                "./src/nodes/output/literal_expression.js",
                "./src/nodes/output/boolean_attribute_expression.js",
                
                
                "./src/nodes/expression/call_expression.js",
                "./src/nodes/expression/member_expression.js",
                "./src/nodes/expression/function_call.js",
                
                "./src/nodes/operation/operation.js",
                "./src/nodes/operation/conditional_operation.js",
                "./src/nodes/operation/binary_operation.js",
                "./src/nodes/operation/unary_operation.js",
                "./src/nodes/operation/in_operation.js",
                "./src/nodes/operation/math_operation.js",
                "./src/nodes/operation/plus_operation.js",
                "./src/nodes/operation/relational_operation.js",
                "./src/nodes/operation/equality_operation.js",
                "./src/nodes/operation/logical_operation.js",
                
                
                "./src/nodes/literal/string_literal.js",
                "./src/nodes/literal/array_literal.js",
                "./src/nodes/literal/boolean_literal.js",
                "./src/nodes/literal/numeric_literal.js",
                "./src/nodes/literal/this_literal.js",
                "./src/nodes/literal/null_literal.js",
                "./src/nodes/literal/map_literal.js",
                
                "./src/nodes/block/block.js",
                "./src/nodes/block/scoped_block.js",
                "./src/nodes/block/branched_block.js",
                "./src/nodes/block/header_block.js",
                "./src/nodes/block/foreach_block.js",
                "./src/nodes/block/helper_block.js",
                "./src/nodes/block/if_else_block.js",
                "./src/nodes/block/if_block.js",
                "./src/nodes/block/else_block.js",
                "./src/nodes/block/program.js",


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
            files: [
                "./src/*",
                "./src/nodes/*",
                "./src/nodes/output/*",
                "./src/nodes/block/*",
                "./src/nodes/expression/*",
                "./src/nodes/operation/*",
                "./src/nodes/literal/*",
                "./src/traversals/*"
            ],
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
        var map = fs.readFileSync("./src/map.js", "utf-8");
        var htmlcontext = fs.readFileSync("./src/html_context_parser.js", "utf-8");
        var rt = fs.readFileSync("./src/runtime.js", "utf-8");
        var rtend = fs.readFileSync("./src/runtime_end.js", "utf-8");
       
        var compiled = (rtbegin + map + htmlcontext + rt + rtend).replace( /@VERSION/g, version );
        fs.writeFileSync( './runtime.js', compiled, "utf-8" );
            
    });
    
    grunt.registerTask( "default", ["build", "runtimeCode"] );
    grunt.loadNpmTasks('grunt-contrib-watch');
};