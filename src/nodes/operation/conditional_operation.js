var ConditionalOperation = TemplateExpressionParser.yy.ConditionalOperation = (function() {
    var _super = Operation.prototype,
        method = ConditionalOperation.prototype = Object.create(_super);
    
    method.constructor = ConditionalOperation;
    
    function ConditionalOperation( condition, ifTrue, ifFalse) {
        _super.constructor.apply(this, arguments);
        this.condition = condition;
        this.ifTrue = ifTrue;
        this.ifFalse = ifFalse;
        
        if( this.condition.isStatic() &&
            this.ifTrue.isStatic() &&
            this.ifFalse.isStatic() ) {
            this.setStatic();
        }
    }
    
    method.toString = function() {
        if( this.isStatic() ) {
            return this.unboxStaticValue().toString();
        }
        var ret = (this.condition.isBooleanOperation() ?
                this.condition.toString() + " ? " + this.ifTrue.toString() + " : " + this.ifFalse.toString() :
                boolOp(this.condition) + " ? " + this.ifTrue.toString() + " : " + this.ifFalse.toString());
                
        return this.parens ? '(' + ret + ')' : ret;
    };
    
    method.resolveStaticOperation = function() {
        if( this.condition.unboxStaticValue().isStaticallyTruthy() ) {
            return this.ifTrue.unboxStaticValue();
        }
        return this.ifFalse.unboxStaticValue();
    }
    
    return ConditionalOperation;
})();