//A block that has its own variable scope
var ScopedBlock = TemplateExpressionParser.yy.ScopedBlock = (function() {
    var _super = Block.prototype,
        method = ScopedBlock.prototype = Object.create(_super);
    
    method.constructor = ScopedBlock;
    
    function ScopedBlock() {
        _super.constructor.apply(this, arguments);
        this.helpers = [];
        this.variables = {};
    }

    method.setHelpers = function( helpers ) {
        this.helpers = helpers;  
    };

    method.getHelpers = function() {
        return this.helpers;
    };
    
    method.getName = function() {
        return null;
    };
    
    method.unmergeVariables = function( varsSet ) {
        for( var key in varsSet ) {
            if( varsSet.hasOwnProperty(key) && this.variables.hasOwnProperty(key) ) {
                delete this.variables[key];
            }
        }
    };
    
    method.mergeVariables = function( varsSet ) {
        for( var key in varsSet ) { 
            if( varsSet.hasOwnProperty( key ) ) {
                this.variables[key] = true;
            } 
        }
    };
    
    method.shouldCheckDataArgument = function() {
        return false;
    };
    
    method.shouldDeclareGlobalsSeparately = function() {
        return true;
    };
    
    method.getVariables = function() {
        return this.variables;
    };
    
    method.establishReferences = function( globalReferences, scopedReferences ) {
        var helperNames = {},
            helpers = this.helpers,
            vars = this.getVariables(),
            possibleGlobal,
            shouldCheckDataArgument = this.shouldCheckDataArgument(),
            shouldDeclareGlobalsSeparately = this.shouldDeclareGlobalsSeparately(),
            hLen = helpers.length;

        for( var i = 0; i < hLen; ++i ) {
            helperNames[helpers[i].getName()] = true;
        }

        for( var key in vars ) {
            if( vars.hasOwnProperty( key ) && //Don't override helpers
                !helperNames.hasOwnProperty( key ) ) {
                
                
                if( ( possibleGlobal = globalsAvailable.hasOwnProperty(key) ) ) {
                    if( !shouldDeclareGlobalsSeparately ) {
                        if( shouldCheckDataArgument ) {
                            scopedReferences.push(key + " = (___hasown.call(___data, '"+key+"' ) ? ___data."+key+":"+
                                    "___hasown.call(this, '"+key+"' ) ? this."+key+" : ___global." + key);
                        }
                        else {
                            scopedReferences.push(key + " = this."+key+" || (___hasown.call(this, '"+key+"' ) ? this."+key+" : ___global." + key + ")");
                        }
                        continue;
                    }
                    else {
                        globalReferences.push("____"+key + " = ___global." + key);
                    }
                }
                
                if( shouldCheckDataArgument ) {
                    scopedReferences.push(key + " = (___hasown.call(___data, '"+key+"' ) ? ___data."+key+":"+
                                    "___hasown.call(this, '"+key+"' ) ? this."+key+":"+
                    ( possibleGlobal ? "____"+key : 'null') + ")");
                }
                else {
                    scopedReferences.push(key + " = this."+key+" || (___hasown.call(this, '"+key+"' ) ? this."+key+" :"+
                    ( possibleGlobal ? "____"+key : 'null') + ")");
                
                }              
             }
        }

    };
    
    return ScopedBlock;
})();
