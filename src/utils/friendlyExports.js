var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


var get_node_code = require('./get_node_code');

module.exports = function (ast, config) {
    visit(ast, {

        /*
        This is a callExpression:
            require.d(t, "c", function() { return 1; })
         */
        visitCallExpression(path) {
            var  target, parentFunction;

            if (target = get_target(path, config)) {
                // debug
                var  contents = get_node_code(path.node); console.log('found an exports:'+contents);

                parentFunction = get_parent_function(path, 0);
                if (parentFunction) {
                    parentFunction.body.body.push(build_VariableAssignment('exports', target[1], target[2]))
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

const max_try_times = 4;

function get_parent_function(path, try_time) {
    if (try_time > max_try_times) return null;

    if (path.parent && path.parent.node.type === 'FunctionExpression') {
        return path.parent.node
    } else
        return get_parent_function(path.parent, try_time + 1)

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
function get_target(path, config) {
    var target, contents = get_node_code(path.node);
    if ((target = contents.match(config.friendlyExportsFrom)) !== null) {
        console.log(`friendlyExportsFrom exec found exports.${target[1]} = ${target[2]}`)
        return target;
    }
    return false;
}
