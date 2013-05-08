//A block that has its own variable scope
var ScopedBlock = TemplateExpressionParser.yy.ScopedBlock = (function() {
    var _super = Block.prototype,
        method = ScopedBlock.prototype = Object.create(_super);
    
    method.constructor = ScopedBlock;
    
    function ScopedBlock() {
        _super.constructor.apply(this, arguments);
        this.helpers = [];
        this.references = new Map();
        this.helperNames = new Map();
    }
    
    method.putCloneProps = function( clonedObj ) {
        _super.putCloneProps.call( this, clonedObj );
        clonedObj.helpers = this.helpers.slice(0);
        clonedObj.references = this.references.clone();
        clonedObj.helperNames = this.helperNames.clone();
    };

    method.setHelpers = function( helpers ) {
        this.helpers = helpers;
        for( var i = 0; i < helpers.length; ++i ) {
            this.helperNames.set(helpers[i].getName(), true);
        }
    };
    
    method.hasHelper = function( name ) {
        return this.helperNames.has( name );
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

    
    method.unmergeReferences = function( referenceExpressionMap ) {
        this.references.removeAll( referenceExpressionMap );
    };
    
    method.mergeReferences = function( referenceExpressionMap ) {
        this.references.mergeIfNotExists( referenceExpressionMap );
    };
            
    method.getReferences = function() {
        return this.references;
    };
    
    method.referenceAssignment = function( noData ) {
        var indent = this.getIndentStr(),
            references = this.getNonHelperReferences();
        var ret = "";
        if( noData ) {
            for( var i = 0; i < references.length; ++i ) {
                var ref = references[i];
                ret += "var " + ref + " = (___r.hasown.call(___self, '"+ref+"') ? ___self."+ref+" : ___ext.get('"+ref+"'));\n" + indent + "    ";
            }
        }
        else {
            for( var i = 0; i < references.length; ++i ) {
                var ref = references[i];
                ret += "var " + ref + " = (___r.hasown.call(___data, '"+ref+"') ? ___data."+ref+" : (___r.hasown.call(___self, '"+ref+"') ? ___self."+ref+" : ___ext.get('"+ref+"')));\n" + indent + "    ";
            }
        }
        return ret;
    };
    
    //Get references that don't refer to a helper call
    method.getNonHelperReferences = function() {
        var self = this, nonHelperReferences = [];
        this.references.forEach(function( key ){
            if( !self.helperNames.has( key ) ) {
                nonHelperReferences.push(key);
            }
        }, this );
        return nonHelperReferences;
    };
    
    return ScopedBlock;
})();

