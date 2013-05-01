var ForeachBlock = TemplateExpressionParser.yy.ForeachBlock = (function() {
    var _super = Block.prototype,
        method = ForeachBlock.prototype = Object.create(_super);

    var randomId = (function() {
        var id = 0;

        return function() {
            return "" + (++id);
        };
    })();
   
    method.constructor = ForeachBlock;
    
    function ForeachBlock( key, value, collection ) {
        _super.constructor.apply(this, arguments);
        this.key = key;
        this.value = value;
        this.collection = collection;
        
        this.id = randomId();
        
        this.buildupExported = false;
        this.buildUps = []; //Build ups from possible inner loops
    }
    
    //Get the variables that the block defines which don't need to be 
    //secured against reference errros
    method.definesVars = function() {
        var ret = {};
        
        if( this.collection instanceof Range ) {
            ret[this.key] = true;
            ret.count = true;
        }
        else if( !this.value ) {
            ret.count = true;
            ret.index = true;
            ret.isLast = true;
            ret.isFirst = true;
            ret.prev = true;
            ret.next = true;
            ret[this.key] = true;
        }
        else {
            ret[this.key] = true;
            ret[this.value] = true;
        }
        return ret;
    };
    
    method.performAnalysis = function( parent ) {
        
        if( !this.buildupExported ) {
            var nestedLoops = this.getNestedLoops();
            //Adopt the initialization code from the inner loops and take them to the top
            
            for( var i = 0; i < nestedLoops.length; ++i ) {
                nestedLoops[i].buildupExported = true;
                this.buildUps.push( nestedLoops[i].getBuildupCode() );
            }
        }
        
        _super.performAnalysis.call( this, parent );
    };
    
    method.getBuildupCode = function() {
        var id = this.id;
        
        if( this.collection instanceof Range ) {
            var range = this.collection;
 
             if( this.value ) {
                 this.key = this.value;
             }
             
            var minExpr = range.minExpr;
            var maxExpr = range.maxExpr;
            var stepExpr = range.stepExpr;
  
            return "var ___min"+id+" = "+minExpr+"; " +
                    "var ___max"+id+" = "+maxExpr+"; " +
                    "var ___step"+id+" = "+stepExpr+"; " +
                    "var ___key"+id+"; "+
                    "var ___doLoop"+id+" = true;" +
                                    //Prevent infinite or empty loops
                    "if( ( (___min"+id+" === ___max"+id+") || (___min"+id+" >= ___max"+id+" && ___step"+id+" > 0) || (___min"+id+" <= ___max"+id+" && ___step"+id+" < 0) ) ) {___doLoop"+id+" = false;}"+
                    " var ___ref"+id+" = (___min"+id+" < ___max"+id+" ? 1 : -1);" +
                    " ___ref = ___ref"+id+" === 1 ? Math.ceil : Math.floor; "+
                    " var ___count"+id+" = ___ref"+id+" * (___ref((___max"+id+" - ___min"+id+") / (___ref"+id+" * ___step"+id+")) + ___ref"+id+"), ___prevKey"+id+", ___prevCount"+id+"; ";
        }
        else {
            return ""; //TODO
        }
        
    };
    
    //TODO nested loop optimizations - add their static startup stuff at the top of this loop
    method.toString = function() {
        var id = this.id;
        
        var body = _super.toString.call( this );
        
        
        
        //Range iteration @for( item from 5 to 10 by 5)
        if( this.collection instanceof Range ) {        
            return this.buildUps.join("") + (!this.buildupExported ? this.getBuildupCode() : "") + 
                    "    var count, "+this.key+";" +
                    "    for( var ___key"+id+" = ___min"+id+"; ___doLoop"+id+"; ___key"+id+" += ___step"+id+" ) { " + ( this.buildupExported ? //Protect values in nested loops
                    "       ___prevKey"+id+" = "+this.key+"; "+
                    "       ___prevCount"+id+" = count;" : "" )+
                    "       "+this.key+" = ___key"+id+";"+
                    "       count = ___count"+id+";" +
                            body  + ( this.buildupExported ? //Protect values in nested loops
                    "       "+this.key+" = ___prevKey"+id+";"+
                    "       count = ___prevCount"+id+"; " : "" )+
                    "       if( ___ref"+id+" === 1 ?  ___key"+id+" >= ___max"+id+" : ___key"+id+" <= ___max"+id+" ) {"+
                    "            break;"+
                    "        }"+
                    "    } ";
                   

        } 
        else if( !this.value ) { //Array iteration
            return  " var ___collection"+id+" = "+this.collection+";" +
                    " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
                    " var ___count"+id+" = ___collection"+id+".length; "+ (this.buildupExported ?
                    " var ___prevKey"+id+", ___prevPrev"+id+", ___prevNext"+id+",___prevCount"+id+", ___prevIndex"+id+" , ___prevIsLast"+id+" , ___prevIsFirst"+id+" ; " : "") +
                    "  var count, "+this.key+", index, isLast, isFirst, prev, next; "+
                    "            for( var ___i"+id+" = 0; ___i"+id+" < ___count"+id+"; ++___i"+id+" ) {" + ( this.buildupExported ? //Protect values in nested loops
                    "                ___prevCount"+id+" = count;" +
                    "                 ___prevIsLast"+id+" = isLast;" +
                    "                 ___prevIsFirst"+id+" = isFirst;" +
                    "                 ___prevPrev"+id+" = prev;" +
                    "                 ___prevNext"+id+" = next;" +
                    "                 ___prevIndex"+id+" = index;" +
                    "                 ___prevKey"+id+" = "+this.key+";" : "" ) +
                    "                count = ___count"+id+";" +
                    "                "+this.key+" = ___collection"+id+"[___i"+id+"];" +
                    "                index = ___i"+id+";" +
                    "                isLast = ___i"+id+" === ___count"+id+" - 1;" +
                    "                isFirst = ___i"+id+" === 0;" +
                    "                prev = ___collection"+id+"[___i"+id+" - 1];" +
                    "                next = ___collection"+id+"[___i"+id+" + 1];" +
                                body + ( this.buildupExported ? //Protect values in nested loops
                    "          count = ___prevCount"+id+";" + 
                    "          isLast = ___prevIsLast"+id+";" +
                    "          isFirst = ___prevIsFirst"+id+";" +
                    "          index = ___prevIndex"+id+";" +
                    "          prev = ___prevPrev"+id+";" +
                    "          next = ___prevNext"+id+";" +
                    "          "+this.key+" = ___prevKey"+id+";" : "" )+
                    "            }";
        }
        else {  //Object/Map iteration
            return  " var ___collection"+id+" = "+this.collection+";" +
                    " ___collection"+id+" = ___isObject(___collection"+id+") ? ___collection"+id+" : {}; " +
                    "  var ___prevKey"+id+", ___prevValue"+id+", ___key"+id+"; " +
                    "  var "+this.key+", "+this.value+"; " +
                    "            for( ___key"+id+" in ___collection"+id+" ) { if( ___hasown.call( ___collection"+id+", ___key"+id+") ) {" + ( this.buildupExported ? //Protect values in nested loops
                    "               ___prevKey"+id+" = "+this.key+";" +
                    "               ___prevValue"+id+" = "+this.value+";" : "" )+
                    "                "+this.key+" = ___key"+id+";" +
                    "                "+this.value+" = ___collection"+id+"[___key"+id+"];" +
                            body + ( this.buildupExported ?  //Protect values in nested loops
                    "                "+this.key+" = ___prevKey"+id+";" +
                    "                "+this.value+" = ___prevValue"+id+"; " : "")+
                    "            }}";
        }
    };
   
    return ForeachBlock;
})();
