var Range = TemplateExpressionParser.yy.Range = (function() {
    var method = Range.prototype;
    
    var sign = function(v){
        return v === "+" || v === "-";
    }
    
    function Range( minExpr, maxExpr, stepExpr ) {
        this.minExpr = minExpr;
        this.maxExpr = maxExpr;
        this.stepExpr = stepExpr || "1";
    }
    
    return Range;
})();
