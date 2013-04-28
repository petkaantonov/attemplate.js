var ForeachBlock = (function() {
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
    }

    method.toString = function() {
        var id = randomId();
        var body = _super.toString.call( this );
        
        //Short array iteration for @for( items ) <div>@name</div>
        if( !this.key && !this.value ) {
            var key = "___key" + randomId();
            return "    (function(___collection"+id+"){" +
            " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
            "            var count = ___collection"+id+".length;" +
            "            for( var ___i"+id+" = 0, ___len"+id+" = count; ___i"+id+" < ___len"+id+"; ++___i"+id+" ) {" +
            "                var index = ___i"+id+";" +
            "    with( ___collection"+id+"[___i"+id+"] ) { " +
                    body +
            "    }" +
            "}" +
            "    }).call(this, "+this.collection+");";
        }
        //Range iteration @for( item in | 5 -> 10| 5)
        else if( this.collection instanceof Range ) {
            var range = this.collection;
            if( this.value ) {
                this.key = this.value;
            }
            
            return "    (function(){" +
                    "var ___min"+id+" = ___ensureNumeric("+range.minExpr+"); " +
                    "var ___max"+id+" = ___ensureNumeric("+range.maxExpr+"); " +
                    "var ___step"+id+" = ___ensureNumeric("+range.stepExpr+") || 1; " +
                    
                    "if( ___min"+id+" === ___max"+id+" ) { return; }" +
                    
                    "if( ___min"+id+" > ___max"+id+" ) { " +
                    "    var count = ___min"+id+" - ___max"+id+"; " +
                    "    for( var "+this.key+" = ___min"+id+"; "+this.key+" >= ___max"+id+"; "+this.key+" -= ___step"+id+" ) { " +
                            body  +
                    "    } " +
                    "} " +
                    "else { " +
                    "    var count = ___max"+id+" - ___min"+id+"; " +
                    "    for( var "+this.key+" = ___min"+id+"; "+this.key+" <= ___max"+id+"; "+this.key+" += ___step"+id+" ) { " +
                            body  +
                    "    } " +
                    "} " +
                    "    }).call(this);";
        } 
        else if( !this.value ) { //Array iteration
            return  "    (function(___collection"+id+"){" +
                    " ___collection"+id+" = ___isArray(___collection"+id+") ? ___collection"+id+" : ___ensureArrayLike(___collection"+id+"); " +
                    "            var count = ___collection"+id+".length;" +
                    "            for( var ___i"+id+" = 0, ___len"+id+" = count; ___i"+id+" < ___len"+id+"; ++___i"+id+" ) {" +
                    "                var "+this.key+" = ___collection"+id+"[___i"+id+"];" +
                    "                var index = ___i"+id+";" +
                            body +
                    "            }" +
                    "    }).call(this, "+this.collection+");";
        }
        else {  //Object/Map iteration
            return  "    (function(___collection"+id+"){" +
                    " ___collection"+id+" = ___isObject(___collection"+id+") ? ___collection"+id+" : {}; " +
                    "            for( var "+this.key+" in ___collection"+id+" ) { if( ___hasown.call( ___collection"+id+", "+this.key+") ) {" +
                    "                var "+this.value+" = ___collection"+id+"["+this.key+"];" +
                            body +
                    "            }}" +
                    "    }).call(this, "+this.collection+");";
        }
    };
   
    return ForeachBlock;
})();