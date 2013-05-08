var Range = TemplateExpressionParser.yy.Range = (function() {
    var _super = StaticallyResolveableElement.prototype,
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
            stepExpr = this.stepExpr;

        if( minExpr.isStatic() ) {
            minExpr = minExpr.unboxStaticValue();
            if( !(minExpr instanceof NumericLiteral) ) {
                minExpr.raiseError("Range can only start from a number type." );
            }
            minExpr = +minExpr.toString();

        }
        else {
            minExpr = "___r.ensureNumeric("+minExpr+");";
        }
  
        if( maxExpr.isStatic() ) {
            maxExpr = maxExpr.unboxStaticValue();
            if( !(maxExpr instanceof NumericLiteral) ) {
                maxExpr.raiseError("Range can only end to a number type.");
            }
            maxExpr = +maxExpr.toString();
        }
        else {
            maxExpr = "___r.ensureNumeric("+maxExpr+");";
        }
        
        if( !stepExpr ) {
            stepExpr = 1;
        }
        else if( stepExpr.isStatic() ) {
            steoExpr = stepExpr.unboxStaticValue();
            if( !(stepExpr instanceof NumericLiteral) ) {
                stepExpr.raiseError("Range step can only be a number type." );
            }
            stepExpr = +stepExpr.toString();
        }
        else {
            stepExpr = "___r.ensureNumeric("+stepExpr+") || 1;";
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
