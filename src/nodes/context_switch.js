//Context switch nodes are manually inserted at key branch points so that
//dynamic entry to the branches propagates context properly

/*
    e.g. (Contrived example)
    
    <a href="@if( value ) {
        javascript:
    }@data"></a>
 
    If the branch is taken then the context for @data is javascript in URL in attribute,
    otherwise it's plain URL. But it cannot be known until runtime. So context switch
    node is inserted at the end of the if block.
    
*/
var ContextSwitch = TemplateExpressionParser.yy.ContextSwitch = (function() {
    var _super = ProgramElement.prototype,
        method = ContextSwitch.prototype = Object.create(_super);
    
    method.constructor = ContextSwitch;
    
    function ContextSwitch( escapeFn ) {
        _super.constructor.apply(this, arguments);
        this.escapeFn = escapeFn;
    }
    
    method.toString = function() {
        var escapeFn = this.escapeFn;

        if( escapeFn.name || escapeFn.name === 0 ) {
            escapeFn = escapeFn.name;
        }
        else if( typeof escapeFn === "object" ) {
            escapeFn = escapeFn.toString();    
        }
                        
        return this.getIndentStr() + '___context = ' +escapeFn + ';\n';
    }
    
    ContextSwitch.DEFAULT = new ContextSwitch(HtmlContextParser.context.NO_ESCAPE);
    
    return ContextSwitch;
})();