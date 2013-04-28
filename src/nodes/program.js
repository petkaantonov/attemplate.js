var Program = (function() {
    var _super = ScopedBlock.prototype,
        method = Program.prototype = Object.create(_super);
    
    method.constructor = Program;
    
    var idName = "___template___";
    
    function Program() {
        _super.constructor.apply(this, arguments);
        this.helperName = null;
    }
    
    method.getName = function() {
        return this.helperName;
    };
    
    method.shouldCheckDataArgument = function() {
        return !!this.helperName;
    };
    
    method.asHelper = function( name ) {
        var ret = new Program();
        for( var key in this ) {
            if( this.hasOwnProperty( key ) ) {
                ret[key] = this[key];
            }
        }
        ret.helperName = name;
        return ret;
    };
    

    method.toHelperString = function() {
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
        
        this.establishReferences( globalReferences, scopedReferences );

        ret.push( "var "+this.helperName+" = (function() {" );
        
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }

        
        ret.push( this.getHelperCode() );
        
        ret.push( "function "+idName+"( ___data ) { ___data = ___data || {}; var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return new ___Safe(___html.join(''), 'HTML'); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(this, data); }; })();");
        
        return ret.join("");
    };
    
    method.getHelperCode = function() {
        var ret = [];
        for( var i = 0; i < this.helpers.length; ++i ) {
            ret.push( this.helpers[i].toString() );
        }
        return ret.join("");
    };
    
    method.getCode = function() {
        var ret = [];
        for( var i = 0; i < this.statements.length; ++i ) {
            ret.push( this.statements[i].toString() );
        }
        return ret.join("");
    };
    
    method.toString = function() {
        if( this.helperName ) {
            return this.toHelperString();            
        }
        
        var ret = [],
            scopedReferences = [],
            globalReferences = [];
                
        this.establishReferences( globalReferences, scopedReferences );
        
        ret.push( programInitBody );
                
        if( globalReferences.length ) {
            ret.push( "var " + globalReferences.join(", \n") + ";");
        }
        
        ret.push( this.getHelperCode() );
        
        ret.push( "function "+idName+"() { var ___html = [];" );
        
        if( scopedReferences.length )  {
            ret.push( "var " + scopedReferences.join(", \n") + ";");
        }
        
        ret.push( this.getCode() );
        
        ret.push( "return ___html.join(''); }" );
        
        ret.push( "return function( data ) { return "+idName+".call(data); }; ");
        
        return ret.join("");
    };
    
    return Program;
})();