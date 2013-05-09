var Combiner = TemplateExpressionParser.yy.Combiner = (function() {
    var method = Combiner.prototype;
    
    function Combiner( ast ) {
        assert( ast instanceof Snippet, "Must be top level construct" );
        this.ast = ast;
    }
    
    
    method.combineAssociativeOperations = function() {
        this.ast.traverse( assoc );
    };
        
    var assoc = function( node, parent, depth ) {
        if( ( node instanceof BinaryOperation ) && !node.isStatic() ) {
        
            if( node.isCommutative() &&
                node.operandLeft.isStatic() &&
                !node.operandRight.isStatic()
            ) {
                node.swapOperands();
            }
        
        
            var left = node.operandLeft,
                right = node.operandRight,
                newOp;
            
            if( left instanceof node.constructor ) {
                var leftleft = left.operandLeft,
                    leftright = left.operandRight;
                    
                    
                if( ( newOp = new node.constructor( leftright, right, node.operator ) ).isStatic() ) {
                    node.operandLeft = leftleft;
                    node.operandRight = newOp.unboxStaticValue();
                }       
            }
            else if( right instanceof node.constructor ) {
                var rightleft = right.operandLeft,
                    rightright = right.operandRight;
                    
                if( ( newOp = new node.constructor( left, rightleft, node.operator ) ).isStatic() ) {
                    node.operandLeft = newOp.unboxStaticValue();
                    node.operandRight = rightright;
                }
            }
        }
    };
    
    return Combiner;
})();


