var Range = TemplateExpressionParser.yy.Range = (function() {
    var _super = ProgramElement.prototype,
        method = Range.prototype = Object.create(_super);
    
    method.constructor = Range;
    
    function Range( minExpr, maxExpr, stepExpr ) {
        _super.constructor.apply(this, arguments);
        this.minExpr = minExpr;
        this.maxExpr = maxExpr;
        this.stepExpr = stepExpr;
        this.static = false;
        this.checkExpr();
    }
    
    method.setStatic = function() {
        this.static = true;
    };
    
    method.isStatic = function() {
        return this.static;
    };
    
    //Do some checks on static types, evaluate static expressions to their values and assign
    method.checkExpr = function() {
        var minExpr = this.minExpr,
            maxExpr = this.maxExpr,
            stepExpr = this.stepExpr,
            type;
        
        
        
        if( minExpr.isStatic() ) {
            if( (type = minExpr.getStaticType() ) !== "number" ) {
                minExpr.raiseError("Range cannot start from a " + type );
            }
            minExpr = +minExpr.toString();

        }
        else {
            minExpr = "___ensureNumeric("+minExpr+");";
        }
  
        if( maxExpr.isStatic() ) {
            if( (type = maxExpr.getStaticType() ) !== "number" ) {
                maxExpr.raiseError("Range cannot end to a " + type );
            }
            maxExpr = +maxExpr.toString();
        }
        else {
            maxExpr = "___ensureNumeric("+maxExpr+");";
        }
        
        if( !stepExpr ) {
            stepExpr = 1;
        }
        else if( stepExpr.isStatic() ) {
            if( (type = stepExpr.getStaticType() ) !== "number" ) {
                stepExpr.raiseError("Range step cannot be a " + type );
            }
            stepExpr = +stepExpr.toString();
        }
        else {
            stepExpr = "___ensureNumeric("+stepExpr+") || 1;";
        }
        
        if( isFinite( minExpr ) && isFinite( maxExpr ) && isFinite( stepExpr ) ) {
            this.setStatic();

            if( minExpr === maxExpr ) {
                this.minExpr.raiseError("The expression will never result in the loop body to be executed because 'from' and 'to' are of same value.");
            }
            else if( minExpr >= maxExpr && stepExpr > 0 ) {
                this.minExpr.raiseError("The expression will result in an infinite loop because 'from' is higher than 'to' and the step size is positive. Use a negative step size.");
            }
            else if( minExpr <= maxExpr && stepExpr < 0 ) {
                this.minExpr.raiseError("The expression will result in an infinite loop because 'from' is lower than 'to' and the step size is negative. Use a positive step size.");
            }
            else if( stepExpr === 0 ) {
                this.stepExpr.raiseError("The expression will result in an infinite loop because step size is 0.");
            }
        }
        
        this.minExpr = minExpr;
        this.maxExpr = maxExpr;
        this.stepExpr = stepExpr;
    };
    
    return Range;
})();
