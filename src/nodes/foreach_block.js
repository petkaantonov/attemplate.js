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
            //Adopt the initialization code from the inner loops and take them to the top
            var nestedLoops = this.getNestedLoops();
            for( var i = 0; i < nestedLoops.length; ++i ) {
                nestedLoops.buildupExported = true;
            }
        }
        _super.performAnalysis.call( this );
    };
    
    //TODO nested loop optimizations - add their static startup stuff at the top of this loop
    method.toString = function() {
        var id = randomId();
        
        var body = _super.toString.call( this );
        
        
        
        //Range iteration @for( item from 5 to 10 by 5)
        if( this.collection instanceof Range ) {
            var range = this.collection;
            if( this.value ) {
                this.key = this.value;
            }
            
            var minExpr = (range.minExpr.isPureNumber && range.minExpr.isPureNumber()) ? +range.minExpr.identifier : "___ensureNumeric("+range.minExpr+");";
            var maxExpr = (range.maxExpr.isPureNumber && range.maxExpr.isPureNumber()) ? +range.maxExpr.identifier : "___ensureNumeric("+range.maxExpr+");";
            var stepExpr = (isFinite(range.stepExpr)) ? +range.stepExpr : ((range.stepExpr.isPureNumber && range.stepExpr.isPureNumber()) ? (+range.stepExpr.identifier): "___ensureNumeric("+range.stepExpr+") || 1;");

            if( isFinite( minExpr ) && isFinite( maxExpr ) && isFinite( stepExpr ) ) {
                /*Todo: line numbers*/
                if( minExpr === maxExpr ) {
                    doError("The range expression will never result in the loop body to be executed because 'from' and 'to' are of same value.");
                }
                else if( minExpr >= maxExpr && stepExpr > 0 ) {
                    doError("The range expression will never result in the loop body to be executed because 'from' is higher than 'to' and the step size is positive. Use a negative step size.");
                }
                else if( minExpr <= maxExpr && stepExpr < 0 ) {
                    doError("The range expression will never result in the loop body to be executed because 'from' is lower than 'to' and the step size is negative. Use a positive step size.");
                }
                else if( stepExpr === 0 ) {
                    doError("The range expression will result in an infinite loop because step size is 0.");
                }
            }
                        
            return "var ___min"+id+" = "+minExpr+"; " +
                    "var ___max"+id+" = "+maxExpr+"; " +
                    "var ___step"+id+" = "+stepExpr+"; " +
                    "var ___key"+id+"; "+
                                    //Prevent infinite or empty loops
                    "if( !( (___min"+id+" === ___max"+id+") || (___min"+id+" >= ___max"+id+" && ___step"+id+" > 0) || (___min"+id+" <= ___max"+id+" && ___step"+id+" < 0) ) ) {"+
                    " var ___ref"+id+" = (___min"+id+" < ___max"+id+" ? 1 : -1);" +
                    " ___ref = ___ref"+id+" === 1 ? Math.ceil : Math.floor; "+
                    " var ___count"+id+" = ___ref"+id+" * (___ref((___max"+id+" - ___min"+id+") / (___ref"+id+" * ___step"+id+")) + ___ref"+id+"), ___prevKey"+id+", ___prevCount"+id+"; "+
                    "    var count, "+this.key+";" +
                    "    for( var ___key"+id+" = ___min"+id+"; ; ___key"+id+" += ___step"+id+" ) { " +                    
                    "       ___prevKey"+id+" = "+this.key+"; "+
                    "       ___prevCount"+id+" = count;" +
                    "       "+this.key+" = ___key"+id+";"+
                    "       count = ___count"+id+";" +
                            body  +
                    "       "+this.key+" = ___prevKey"+id+";"+
                    "       count = ___prevCount"+id+"; "+
                    "       if( ___ref"+id+" === 1 ?  ___key"+id+" >= ___max"+id+" : ___key"+id+" <= ___max"+id+" ) {"+
                    "            break;"+
                    "        }"+
                    "    } " +
                    " } ";

        } 
        else if( !this.value ) { //Array iteration
            return  " var ___collection"+id+" = "+this.collection+";" +
                    " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
                    " var ___count"+id+" = ___collection"+id+".length, ___prevKey"+id+", ___prevCount"+id+", ___prevIndex"+id+" , ___prevIsLast"+id+" , ___prevIsFirst"+id+" ; "+
                    "  var count, "+this.key+", index, isLast, isFirst; "+
                    "            for( var ___i"+id+" = 0; ___i"+id+" < ___count"+id+"; ++___i"+id+" ) {" +
                    "                ___prevCount"+id+" = count;" +
                    "                 ___prevIsLast"+id+" = isLast;" +
                    "                 ___prevIsFirst"+id+" = isFirst;" +
                    "                 ___prevIndex"+id+" = index;" +
                    "                 ___prevKey"+id+" = "+this.key+";" +
                    "                count = ___count"+id+";" +
                    "                "+this.key+" = ___collection"+id+"[___i"+id+"];" +
                    "                index = ___i"+id+";" +
                    "                isLast = ___i"+id+" === ___count"+id+" - 1;" +
                    "                isFirst = ___i"+id+" === 0;" +
                                body +
                    "          count = ___prevCount"+id+";" + //This should be much cheaper than using closures or the like, especially in nested loops
                    "          isLast = ___prevIsLast"+id+";" +
                    "          isFirst = ___prevIsFirst"+id+";" +
                    "          index = ___prevIndex"+id+";" +
                    "          "+this.key+" = ___prevKey"+id+";" +
                    "            }";
        }
        else {  //Object/Map iteration
            return  " var ___collection"+id+" = "+this.collection+";" +
                    " ___collection"+id+" = ___isObject(___collection"+id+") ? ___collection"+id+" : {}; " +
                    "  var ___prevKey"+id+", ___prevValue"+id+", ___key"+id+"; " +
                    "  var "+this.key+", "+this.value+"; " +
                    "            for( ___key"+id+" in ___collection"+id+" ) { if( ___hasown.call( ___collection"+id+", ___key"+id+") ) {" +
                    "               ___prevKey"+id+" = "+this.key+";" +
                    "               ___prevValue"+id+" = "+this.value+";"+
                    "                "+this.key+" = ___key"+id+";" +
                    "                "+this.value+" = ___collection"+id+"[___key"+id+"];" +
                            body +
                    "                "+this.key+" = ___prevKey"+id+";" +
                    "                "+this.value+" = ___prevValue"+id+"; "+
                    "            }}";
        }
    };
   
    return ForeachBlock;
})();
