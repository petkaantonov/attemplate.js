var Operation = TemplateExpressionParser.yy.Operation = (function() {
    var _super = ProgramElement.prototype,
        method = Operation.prototype = Object.create(_super);
    
    method.constructor = Operation;
    
    var rrelational = /^(?:<|>|>=|<=)$/;

    function isBooleanOp( obj ) {
        return obj.isBooleanOp && obj.isBooleanOp() || false;
    }
    
    function Operation( opStr, op1, op2, isTernary) {
        _super.constructor.apply(this, arguments);
        this.isTernary = !!isTernary;
        this.isUnary = op2 == null;
        this.opStr = opStr;
        this.op1 = op1;
        this.op2 = op2;
        this.madeRelational = false;
        this.static = false;
        
        if( this.opStr === "==" ) {
            this.opStr = "===";
        }
        else if( this.opStr === "!=" ) {
            this.opStr = "!==";
        }
        if( (this.isUnary && this.op1.isStatic()) ||
            (!this.isTernary && this.op1.isStatic() && this.op2.isStatic()) ||
            this.isTernary && this.opStr.isStatic() && this.op1.isStatic() && this.op2.isStatic()
            ) {
            this.setStatic();
        }
        this.cachedStaticResult = null;
    }
        
    method.setStatic = function() {
        this.static = true;
        this.parens = false;
    };
    
    method.isStatic = function() {
        return this.static;
    };
        
    method.isBooleanOp = function() {
        return this.opStr === "in" || this.opStr === "!" ;
    };

    method.isRelational = function() {
        return rrelational.test( this.opStr );
    };
        
    method.toString = function() {
        var ret;
        
        if( this.isStatic() ) {
            return this.getStaticResolvedOp().toString();
        }
      
        if( this.isTernary ) {
            var condition = isBooleanOp(this.opStr) ? this.opStr.toString() : boolOp(this.opStr);
            ret = condition + " ? " + this.op1.toString() + " : " + this.op2.toString();
        }
        else if( this.isUnary ) {
            if( this.opStr === '!' ) {
                if( isBooleanOp( this.op1 ) ) { //Don't call ___boolOp if not necessary
                    ret = '!' + this.op1.toString();
                }
                else {
                    ret = '!' + boolOp(this.op1);
                }
            }
            else {
                ret = " " + this.opStr.toString() + " " + this.op1.toString() + " ";
            }
        }
        else if( this.opStr === "in" ) {
            ret = '___inOperator(' + this.op2.toString() + ', '+ this.op1.toString()+')';
        }
        else {
            //Magic to make a < b < c work properly
            if( this.madeRelational ) {
                if( this.op1.op1 && this.op1.isRelational() ) {
                    this.op1.madeRelational = true;                             
                    ret = '(' + this.op1.toString()+' ) && (' + this.op1.op2.toString() + this.opStr + this.op2.toString()+')';
                }
                else {
                    ret = this.op1.toString() + this.opStr + this.op2.toString();

                }

            }
            else if( this.isRelational() &&
                this.op1.op1 &&
                this.op1.isRelational() ) {
                this.op1.madeRelational = true;
                ret = '(' + this.op1.toString()+' ) && (' + this.op1.op2.toString() + this.opStr + this.op2.toString()+')';
            }
            else {
                ret = this.op1.toString() + this.opStr + this.op2.toString();
            }
        }
                
        return this.parens ? '(' + ret + ')' : ret;
        
    };
 
    method.getStaticResolvedOp = function() {
        if( this.cachedStaticResult ) {
            return this.cachedStaticResult;
        }
        if( this.isUnary ) {
            return (this.cachedStaticResult = this.resolveStaticOperation(this.opStr.toString() + this.op1.toString()));
        }
        else if( this.isTernary ) {             //No need to toString anything
            return (this.cachedStaticResult = this.resolveStaticOperation());
        }
        else {
            return (this.cachedStaticResult = this.resolveStaticOperation(this.op1.toString() + this.opStr + this.op2.toString()));
        }
        
    };

    method.toStringQuoted = function() {
        return this.getStaticResolvedOp().toStringQuoted();
    };
    
    method.memberAccessible = function() {
        return this.getStaticResolvedOp().memberAccessible();
    };
    
    method.getStaticCoercionType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticCoercionType on non-static operation");
        }
        return this.getStaticResolvedOp().getStaticCoercionType();
        
    };
    
    method.resolveStaticOperation = function( op ) {
        
        if( this.isTernary ) {
            if( this.opStr.truthy() ) {
                return this.op1;
            }
            else {
                return this.op2;
            }
        }
        
        else if( this.opStr === "&&" ) {
            if( !this.op1.truthy() ) {
                return this.op1;
            }
            else {
                return this.op2;
            }
        }
        else if( this.opStr === "||" ) {
            if( this.op1.truthy() ) {
                return this.op1;
            }
            else {
                return this.op2;
            }
        }
        //TODO don't cheap out like this
        op = new Function("return " +op)();
        
        switch( this.opStr ) {
            case "<":
            case ">":
            case ">=":
            case "<=":
            case "!":
            case "!==":
            case "===":
                //Evaluation always returns either true or false
                op = new BooleanLiteral(op); break;
            case "-":
            case "*":
            case "/":
            case "%":
                //Evaluation always returns a number
                op = new NumericLiteral(op); break;
            case "+":
                if( this.isUnary ) {//Evaluation always returns a number 
                    op = new NumericLiteral(op);
                }//Evaluation always returns a string 
                else if( (this.op1.getStaticCoercionType() === "string" ) || 
                    (this.op2.getStaticCoercionType() === "string" ) ) {
                    op = StringLiteral.fromRaw(op);
                }
                else {//Evaluation always returns a number 
                    op = new NumericLiteral(op); 
                }
                break;
            case "!":
                   op = new BooleanLiteral(op);
                break;
        }
        return op;
    };
    
    method.boolify = function() {
        switch( this.opStr ) {
            case "&&" :
            case "||" :
                return Operation.boolify( this.op1 ) + " " + this.opStr + " "+ Operation.boolify( this.op2 );
            break;
            
            default:
            
            return Operation.boolify( this );
        }
    };
    
    Operation.boolify = function( expr ) {
        return '((___ref = '+expr+'), ___isArray(___ref) ? ___ref.length > 0 : ___ref)';
    };
    
    return Operation;
})();