//Disables all HTML relations in the templating system so that in can be used
//to generate any kind of content
var NullContextParser = (function() {
    var method = NullContextParser.prototype;
        
        
    function returnThis() { return this; }
    function returnFalse() { return false;}
    function returnNull() { return null; }
        
    function NullContextParser() {
        this.context = HtmlContextParser.context.NO_ESCAPE;
    }
    
    method.pushStack = returnThis;

    method.popStack = returnThis;
    
    method.clone = returnThis;
    
    method.write = returnThis;
    
    method.isWaitingForAttr = returnFalse;
    
    method.currentTagName = returnNull;

    method.close = returnThis;
    
    method.getContext = function() {
        return this.context;
    };
    
    return NullContextParser;
})();
