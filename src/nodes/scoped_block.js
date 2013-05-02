//A block that has its own variable scope
var ScopedBlock = TemplateExpressionParser.yy.ScopedBlock = (function() {
    var _super = Block.prototype,
        method = ScopedBlock.prototype = Object.create(_super);
    
    method.constructor = ScopedBlock;
    
    function ScopedBlock() {
        _super.constructor.apply(this, arguments);
        this.helpers = [];
        this.variables = {};
        this.helperNames = {};
    }

    method.setHelpers = function( helpers ) {
        this.helpers = helpers;
        for( var i = 0; i < helpers.length; ++i ) {
            this.helperNames[helpers[i].getName()] = true;
        }
    };
    
    method.hasHelper = function( name ) {
        return this.helperNames.hasOwnProperty( name );
    };

    method.getHelpers = function() {
        return this.helpers;
    };
    
    method.getName = function() {
        return null;
    };
    
    method.setIndentLevel = function( level ) {
        this.indentLevel = level;
        for( var i = 0; i < this.helpers.length; ++i ) {
            this.helpers[i].setIndentLevel( level );
        }
        return _super.setIndentLevel.call( this, level );

    };
    
    method.performAnalysis = function( parent ) {
        for( var i = 0; i < this.helpers.length; ++i ) {
            this.helpers[i].performAnalysis(this);
        }
        _super.performAnalysis.call( this, parent );
    };

    
    method.unmergeVariables = function( referenceExpressionMap ) {
        for( var key in referenceExpressionMap ) {
            if( referenceExpressionMap.hasOwnProperty(key) && this.variables.hasOwnProperty(key) ) {
                delete this.variables[key];
            }
        }
    };
    
    method.mergeVariables = function( referenceExpressionMap ) {
        var vars = this.getVariables();
        for( var key in referenceExpressionMap ) { 
            if( referenceExpressionMap.hasOwnProperty( key ) &&
                !vars.hasOwnProperty(key) ) {
                vars[key] = referenceExpressionMap[key];
            } 
        }
    };
            
    method.getVariables = function() {
        return this.variables;
    };
    
    //Get references that don't refer to a helper call
    method.getReferences = function() {
        var vars = this.getVariables(),
            references = [];

        for( var key in vars ) {
            if( vars.hasOwnProperty( key ) && //Don't override helpers
                !this.helperNames.hasOwnProperty( key ) ) {
                    references.push(key);   
             }
        }
        return references;
    };
    
    return ScopedBlock;
})();

