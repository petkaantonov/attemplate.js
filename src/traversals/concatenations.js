var Concatenations = TemplateExpressionParser.yy.Concatenations = (function() {

    var isConcatOp = function( node ) {
        return (node instanceof PlusOperation) && 
            /*TODO check for ofNumericNature() ? 
                var a = parser.parse('(a * 5) + (b + 2 * 4)');
            */
               !(node.operandLeft instanceof NumericLiteral ||
               node.operandRight instanceof NumericLiteral);
               
               

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
