var HelperBlock = (function() {
    var _super = ScopedBlock.prototype,
        method = HelperBlock.prototype = Object.create(_super);
    
    method.constructor = HelperBlock;
    
    function HelperBlock( name, parameterNames ) {
        _super.constructor.apply(this, arguments);
        this.name = name;
        this.parameterNames = parameterNames;
        
    }
  
    method.shouldCheckDataArgument = function() {
        return false;
    };

    method.shouldDeclareGlobalsSeparately = function() {
        return false;
    };
    
    //No need to merge the variabls that are declared in parameters
    //Globals and other helper names cannot be known at this time
    method.mergeVariables = function( varsSet ) {
        var vars = this.getVariables();
        
        for( var key in varsSet ) {
            if( varsSet.hasOwnProperty( key ) &&
                this.parameterNames.indexOf( key ) < 0 ) {
                vars[key] = true;
            }
        }
    };
    
    method.toString = function() {
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
        
      
        this.establishReferences( globalReferences, scopedReferences );
        
        ret.push( "var " + this.name + " = function("+this.parameterNames.join(", ")+"){ " );
        
                
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }

        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( "var ___html = [];" );
        
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        
        ret.push( "return new ___Safe(___html.join(''), 'HTML'); };" );
        
        return ret.join( "" );
    };
    
    method.getParameterNames = function() {
        return this.parameterNames;
    };
    
    method.getName = function() {
        return this.name;
    };
    
    return HelperBlock;
})();