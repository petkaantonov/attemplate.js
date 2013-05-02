var MACRO = (function() {
    var MACRO = {};

    var unwrapBody = function( fn ) {
        return fn.toString().replace(/^\s*\(?\s*\(?\s*function\s*\(\)\s*\{/, '').replace(/\}\s*\)?\s*$/, '');
    };

    var unwrapBodyArgs = function( fn ) {
        var unwrapped = unwrapBody(fn).replace(/^\s\s*/, "").replace(/\s$/, "");
        return function() {
            var args = [].slice.call( arguments );
            var indent = this.getIndentStr();
            
            return unwrapped.replace(/^/gm, indent).replace( /\$(\d+)/g, function(g, m1) {
                return args[m1-1];
            });
        };
    };
    
    MACRO.create = unwrapBodyArgs;
    
    return MACRO;
})();