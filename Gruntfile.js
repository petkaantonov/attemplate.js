var fs = require("fs");
var parsergen = require("./src/parsergen.js");
function stringifyClosureBody( code ) {
    code = eval(code).replace(/[\r\n]/g, "").replace( /\\/g, "\\\\").replace(/"/g, '\\"');
    return 'var fnBody = "' + code + '";\n';
}

module.exports = function( grunt ) {


    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
    
        build: {

            src: [
                "./src/html_context_parser.js",
                "./src/closure_body.js",
                "./src/template_parser.js",
                "./src/end.js"
            ],
            dest: './attemplate.js',
            minDest: './attemplate.min.js',
            separator: '\n'
            
        }
    });

    grunt.registerTask( "build", function() {
        var opts = grunt.config("build"),
            files = opts.src,
            dest = opts.dest,
            minDest = opts.minDest,
            separator = opts.separator;
        
        
        var compiled = [];
    
        compiled.push(parsergen("./js_template_expression_grammar.js"));
        compiled.push(fs.readFileSync("./src/js_nodes.js", "utf-8"));
        compiled.push(fs.readFileSync("./src/begin.js", "utf-8"));
          
    
        files.forEach( function( filepath) {

            var contents = fs.readFileSync( filepath, "utf-8");
            if( filepath.indexOf("closure_body") > -1 ) {
                compiled.push(stringifyClosureBody(contents)); 
            }
            else {
                compiled.push(contents);
            }
        });
        
        
        compiled = compiled.join(separator);
        fs.writeFileSync( dest, compiled, "utf-8" );
        
    });
    
    grunt.registerTask( "default", ["build"] );
    
};