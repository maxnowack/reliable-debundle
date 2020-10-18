var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


const _utils = require('../utils/visitor_utils')
var get_node_code = require('../utils/get_node_code');

var friendlyExportsFrom = null;
var deleteOld = false;

module.exports = function (props, config) {

    friendlyExportsFrom = new RegExp(props.regexp)
    deleteOld = props.deleteOld
    return v
}

function v(ast) {
    visit(ast, {

        /*
        This is a callExpression:
            require.d(t, "c", function() { return 1; })
         */
        visitCallExpression(path) {
            var target, parentFunction, new_;

            if (target = get_target(path)) {
                // debug
                // var contents = get_node_code(path.node);console.log('found an exports:' + contents);

                parentFunction = _utils.get_parent_function(path, 0);
                if (parentFunction) {
                    new_ = build_VariableAssignment('exports', target[1], target[2])
                    parentFunction.body.body.push(new_)
                }

                if (deleteOld) {
                    path.value.type = 'Literal'
                    path.value.value = path.value.raw = `exports.${target[1]} = ${target[2]}`
                }

                return false;
            }

            // It's your responsibility to call this.traverse with some
            // NodePath object (usually the one passed into the visitor
            // method) before the visitor method returns, or return false to
            // indicate that the traversal need not continue any further down
            // this subtree.
            this.traverse(path);
        }
    });
}


/**
 * to produce:  leftObj.leftField = right
 */
function build_VariableAssignment(leftObj, leftField, right) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "Identifier",
                    "name": leftObj,
                },
                "property": {
                    "type": "Identifier",
                    "name": leftField,
                },
            },
            "right": {
                "type": "Identifier",
                "name": right,
            }
        }
    }

}


/** now i use RegExp, maybe the better way is AST.

 == sample code:
 n.d(t, 'c', function () {
            return x;
        })

 == changed into by transformRequire

 request.d(t, 'c', function () {
            return x;
        })

 == want to get

 exports.c = x;

 == AST tree of the reuslt of transformRequire:

 {
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "Identifier",
                    "name": "request",
                },
                "property": {
                    "type": "Identifier",
                    "name": "d",
                },
            },
            "arguments": [
                {
                    "type": "Identifier",
                    "name": "t",
                },
                {
                    "type": "Literal",
                    "value": "c",
                    "raw": "'c'",
                },
                {
                    "type": "FunctionExpression",
                    "id": null,
                    "params": [],
                    "body": {
                        "type": "BlockStatement",
                        "body": [
                            {
                                "type": "ReturnStatement",
                                "argument": {
                                    "type": "Identifier",
                                    "name": "x",
                                },
                            }
                        ],
                    },
                }
            ],
        }
    }

 */
function get_target(path) {
    var target, contents = get_node_code(path.node);
    if ((target = contents.match(friendlyExportsFrom)) !== null) {
        console.log(`friendlyExportsFrom exec found exports.${target[1]} = ${target[2]}`)
        return target;
    }
    return false;
}
