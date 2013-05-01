var Operation = TemplateExpressionParser.yy.Operation = (function() {
    var method = Operation.prototype;
    
    var rrelational = /^(?:<|>|>=|<=)$/;

    function isBooleanOp( obj ) {
        return obj.isBooleanOp && obj.isBooleanOp() || false;
    }
    
    function Operation( opStr, op1, op2, isTernary) {
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
            (!this.isTernary && this.op1.isStatic() && this.op2.isStatic())
            ) {
            this.setStatic();
        }
    }
    
    method.setStatic = function() {
        this.static = true;
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
        
        if( this.isStatic() ) {
            ret = this.resolveStaticOperation( ret );
        }
        
        return this.parens ? '(' + ret + ')' : ret;
        
    };
    
    method.getStaticType = function() {
        if( !this.isStatic() ) {
            throw new Error("Cannot call getStaticType on non-static member expression");
        }
        return this.resolveStaticOperation(this.op1.toString() + this.opStr + this.op2.toString()).getStaticType();
        
    };
    
    method.resolveStaticOperation = function( op ) {
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
                else if( (this.op1.getStaticType() === "string" ) || 
                    (this.op2.getStaticType() === "string" ) ) {
                    op = StringLiteral.fromRaw(op);
                }
                else {//Evaluation always returns a number 
                    op = new NumericLiteral(op); 
                }
                break;
            case "&&": 
                    if( !this.op1.truthy() ) {
                        op = this.op1;
                    }
                    else {
                        op = this.op2;
                    }
                break;
            case "||":
                    if( this.op1.truthy() ) {
                        op = this.op1;
                    }
                    else {
                        op = this.op2;
                    }
                break;
        }
        return op;
    };
    
    
    return Operation;
})();