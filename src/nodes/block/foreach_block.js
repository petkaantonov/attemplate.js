var ForeachBlock = TemplateExpressionParser.yy.ForeachBlock = (function() {
    var _super = BranchedBlock.prototype,
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
    
    //TODO do this after AST has been done so nested loops can be done
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
                //this.buildUps.push( nestedLoops[i].getBuildupCode() );
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
            return this._buildUpRange(id, minExpr, maxExpr, stepExpr);
        }
        else {
            return ""; //TODO
        }
       
    };
   

   
    //TODO nested loop optimizations - add their static startup stuff at the top of this loop
    method.toString = function() {
        var id = this.id;
       
        var body = this.statements.join("\n");
       
        //Range iteration @for( item from 5 to 10 by 5)
        if( this.collection instanceof Range ) {       
            return this.buildUps.join("") + this.getBuildupCode() + this._rangeBody(
                id,
                this.key,
                body
            );
        }
        else if( !this.value ) { //Array iteration
            return this._arrayBody(
                id,
                this.key,
                this.collection,
                body
            );
        }
        else {  //Object/Map iteration
            return this._mapBody(
                id,
                this.key,
                this.value,
                this.collection,
                body
            );
        }
    };
  

    method._buildUpRange = MACRO.create(function(){

var ___min$1 = $2;
var ___max$1 = $3;
var ___step$1 = $4;
var ___key$1;
var ___doLoop$1 = true;

if ((___min$1 === ___max$1) ||
    (___min$1 >= ___max$1 && ___step$1 > 0) ||
    (___min$1 <= ___max$1 && ___step$1 < 0)
) {
    ___doLoop$1 = false;
}

var ___ref$1 = (___min$1 < ___max$1 ? 1 : -1);
___ref = ___ref$1 === 1 ? Math.ceil : Math.floor;
var ___count$1 = ___ref$1 * (___ref((___max$1 - ___min$1) / (___ref$1 * ___step$1)) + ___ref$1),
    ___prevKey$1,
    ___prevCount$1;

});
   
    method._rangeBody = MACRO.create(function(){

var count, $2;
for (var ___key$1 = ___min$1; ___doLoop$1; ___key$1 += ___step$1) {
    ___prevKey$1 = $2;
    ___prevCount$1 = count;
    $2 = ___key$1;
    count = ___count$1;
$3
    $2 = ___prevKey$1;
    count = ___prevCount$1;
    if( ___ref$1 === 1 ?  ___key$1 >= ___max$1 : ___key$1 <= ___max$1 ) {
        break;
    }
};

});
   
    method._arrayBody = MACRO.create(function(){
   
var ___collection$1 = $3;
___collection$1 = ___isArray(___collection$1) ? ___collection$1 : [];
var ___count$1 = ___collection$1.length;

var ___prevKey$1,
    ___prevPrev$1,
    ___prevNext$1,
    ___prevCount$1,
    ___prevIndex$1,
    ___prevIsLast$1,
    ___prevIsFirst$1;

var count,
    $2,
    index,
    isLast,
    isFirst,
    prev,
    next;

for (var ___i$1 = 0; ___i$1 < ___count$1; ++___i$1) {
    ___prevCount$1 = count;
    ___prevIsLast$1 = isLast;
    ___prevIsFirst$1 = isFirst;
    ___prevPrev$1 = prev;
    ___prevNext$1 = next;
    ___prevIndex$1 = index;
    ___prevKey$1 = $2;
    count = ___count$1;
    $2 = ___collection$1[___i$1];
    index = ___i$1;
    isLast = ___i$1 === ___count$1 - 1;
    isFirst = ___i$1 === 0;
    prev = ___collection$1[___i$1 - 1];
    next = ___collection$1[___i$1 + 1];
$4
    count = ___prevCount$1;
    isLast = ___prevIsLast$1;
    isFirst = ___prevIsFirst$1;
    index = ___prevIndex$1;
    prev = ___prevPrev$1;
    next = ___prevNext$1;
    $2 = ___prevKey$1;
}


});

    method._mapBody = MACRO.create(function(){

var ___collection$1 = $4;
___collection$1 = ___isObject(___collection$1) ? ___collection$1 : {};

var ___prevKey$1,
    ___prevValue$1,
    ___key$1;
   
var $2, $3;
for (___key$1 in ___collection$1) {
    if (___hasown.call(___collection$1, ___key$1)) {
        ___prevKey$1 = $2;
        ___prevValue$1 = $3;
        $2 = ___key$1;
        $3 = ___collection$1[___key$1];
    $5 
        $2 = ___prevKey$1;
        $3 = ___prevValue$1;
    }
}

});

    return ForeachBlock;
})();
