var Simplification = TemplateExpressionParser.yy.Simplification = (function() {

    function substituteTemplateGlobalConstants() {
    
    }

    function simpleFolds( node, parent, depth, data ) {
        if( node.isStatic() && !(node instanceof TerminalNode) ) {
            data.modCount++;
            parent.replaceChild( node, node.unboxStaticValue() );
        }
    }
       
    function operations( node, parent, depth, data ) {

        if( ( node instanceof BinaryOperation ) ) {

            if( node.isCommutative() &&
                node.operandLeft.isStatic() &&
                !node.operandRight.isStatic()
            ) {
                data.modCount++;
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
                    if( leftleft.isStatic() ) {
                        node.setStatic();
                    }
                    data.modCount++;
                }       
            }
            else if( right instanceof node.constructor ) {
                var rightleft = right.operandLeft,
                    rightright = right.operandRight;

                if( ( newOp = new node.constructor( left, rightleft, node.operator ) ).isStatic() ) {
                    node.operandLeft = newOp.unboxStaticValue();
                    node.operandRight = rightright;
                    if( rightright.isStatic() ) {
                        node.setStatic();
                    }
                    data.modCount++;
                }
            }
        }   //TODO doesn't do full pass after replacement
        else if( node instanceof ConditionalOperation ) {
            if( node.condition.isStatic() ) {
                if( node.condition.unboxStaticValue().isStaticallyTruthy() ) {
                    parent.replaceChild( node, node.ifTrue );
                    data.modCount++;
                }
                else {
                    parent.replaceChild( node, node.ifFalse );
                    data.modCount++;
                }
            }
        }
    }
    
    return {
        run: function( ast ) {
            do {
                var data = {modCount: 0};
                ast.traverse( simpleFolds, data );
                ast.traverse( operations, data );
                
            } while( data.modCount > 0 ); //Might require multiple passes
        }
    };
})();

/*
var a = parser.parse('a * 5 + b + 2 * 4');

var a = parser.parse('"asd1" + (true ? true ? "asd" : daa : daa) + "dasd2" + daa + "asd3" + "asd4"');

parser.yy.Simplification.run( a );

var b = parser.parse('"asd1" + "dasd2" + (varr+3) + daa + "asd3" + "asd4" + object[value + "string"]')
parser.yy.Simplification.run( b );
concats.get(b).join(" + ")

var a = parser.parse('"asd1" + "dasd2" + daa + "asd3" + "asd4"');
parser.yy.Simplification.run( a);
concats.get(a).join(" + ")

var a = parser.parse('("asd1" + ("dasd2" +( daa + ("asd3" + "asd4"))))');
parser.yy.Simplification.run( a);
concats.get(a).join(" + ")


parser.yy.Simplification.run( a );


a.toString();

var a = parser.parse('"asd1" + "dasd2" + daa + "asd3" + "asd4"');

parser.yy.Simplification.run( a );

var a = parser.parse('"asd1" + (true ? true ? "asd" : daa : daa) + "dasd2" + daa + "asd3" + "asd4"');

parser.yy.Simplification.run( a );


a.toString();


var inorder = function( node ) {
    if( node.operandLeft ) inorder( node.operandLeft );
    if( node instanceof parser.yy.TerminalNode ) console.log( "in", node + "");
    if( node.operandRight ) inorder( node.operandRight );
}

var postorder = function( node ) {
    if( node.operandLeft ) postorder( node.operandLeft );
    if( node.operandRight ) postorder( node.operandRight );
    if( node instanceof parser.yy.TerminalNode ) console.log( "post", node + "");
}

var preorder = function( node ) {
    if( node instanceof parser.yy.TerminalNode ) console.log( "pre", node + "");
    if( node.operandLeft ) preorder( node.operandLeft );
    if( node.operandRight ) preorder ( node.operandRight );
    
}

var a = parser.parse('("asd1" + ("dasd2" +( daa + ("asd3" + "asd4"))))');
parser.yy.Simplification.run( a );
a = a.expr;
inorder(a); postorder(a); preorder(a);

var b = parser.parse('"asd1" + "dasd2" + daa + "asd3" + "asd4"');

parser.yy.Simplification.run( b );
b = b.expr;
inorder(b); postorder(b); preorder(b);






var concats = (function() {

    var isConcatOp = function( node ) {
        return (node instanceof parser.yy.PlusOperation) && 
               !(node.operandLeft instanceof parser.yy.NumericLiteral || node.operandRight instanceof parser.yy.NumericLiteral)

    }

    var extractTopLevelConcatenations = function( node, ret ) {
        var left = node.operandLeft,
            right = node.operandRight;
            
        if( isConcatOp(left)) {
            extractTopLevelConcatenations(left, ret);
        }
        else {
            ret.push(left);
        }
        if( isConcatOp(right)) {
            extractTopLevelConcatenations(right, ret);
        }
        else {
            ret.push(right);
        }
    };

    return {
    
        get: function( ast ) {
        
            var expr = ast.getExpression(),
                ret = [];
            
            if( !isConcatOp(expr) ) {
                ret.push( expr );
                return ret;
            }
            //Concatenates at least 2 expressions
            extractTopLevelConcatenations( expr, ret );
            return ret;        
        }    
    };
})();


ret;*/