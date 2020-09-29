const _utils = require('./_utils')

var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


var get_node_code = require('../utils/get_node_code');

var support_nest = false;

module.exports = function (props, config) {
    if (props.support_nest) support_nest = true;

    return v
}

function v(ast) {
    visit(ast, {

        /**

         function x(){
 var s1=3;
 R = false, 3;
}
         AST of its body:

         "body": [              // this is path.parentPath.parentPath.value which I named body
         { // var s1=3;
            "type": "VariableDeclaration",
            ...
          },
         { // R = false, 3;
            "type": "ExpressionStatement",  // this is path.parentPath
            "expression": {
              "type": "SequenceExpression",  // this is path★★★
              "expressions": [
                {
                  "type": "AssignmentExpression",
                   ...
                },
                {
                  "type": "Literal",
                  "value": 3,
                }
              ],
            },
          }
         ],
         * @param path
         */
        visitSequenceExpression(path) {
            var index, body = path.parentPath.parentPath.value;

            if (!Array.isArray(body)) {
                console.log(`not array: ${get_node_code(body)}`)
                return false;
            }

            var work = null;

            switch (path.parentPath.value.type) {
                case 'ExpressionStatement':
                    index = findExpressionStatementIndexInBody(path.node, body);
                    _utils.replaceInArray(
                        path.node,
                        index,
                        body,
                        build_multipe_expStatement(path.node.expressions)
                    )
                    break;
                case 'ReturnStatement':
                    var last_one_which_need_to_return = path.node.expressions.slice(-1)[0],
                        other = path.node.expressions.slice(0, -1);

                    index = findReturnStatementIndexInBody(path.node, body);

                    // move other up
                    _utils.prependInArray(
                        path.parentPath.value,
                        index,
                        body,
                        build_multipe_expStatement(other));

                    // new return
                    path.parentPath.value.argument = last_one_which_need_to_return;
                    // this is the index of new return
                    var return_index = findReturnStatementIndexInBody(null, body);

                    // ensure the new return at the bottom of the body
                    _utils.moveToBottom(path.parentPath.value, return_index, body)
                    break;
                default:
                    work = false;

            }

            if (support_nest || work === false)
                this.traverse(path);
            else
                return false;



        }
    });
}

function findExpressionStatementIndexInBody(node, body) {
    return body.findIndex(item => item.type === 'ExpressionStatement' && item.expression === node)
}

function findReturnStatementIndexInBody(node, body) {
    return body.findIndex(item => item.type === 'ReturnStatement' && (node && item.argument === node || true))
}

function build_multipe_expStatement(some) {
    return some.map(
        function (exp) {
            return {
                "type": "ExpressionStatement",
                "expression": exp
            }
        }
    )
}
