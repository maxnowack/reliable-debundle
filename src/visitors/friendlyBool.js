var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


var get_node_code = require('../utils/get_node_code');

module.exports = function (props, config) {
    return v
}

function v(ast) {
    visit(ast, {

        visitUnaryExpression(path) {
            var node = path.node;
            if (node.operator === '!' && node.argument.type === 'Literal') {
                switch (node.argument.value) {
                    case 0:
                        change_to_bool(node, true)
                        break
                    case 1:
                        change_to_bool(node, false)
                        break;
                }
            }

            return false;
        }
    });
}

function change_to_bool(node, is_true) {
    node.type = "Literal"
    node.value = is_true ? true : false
    node.raw = is_true ? "true" : "false"

    delete node.argument, node.operator

}

function make_bool(is_true) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "Literal",
            "value": is_true ? true : false,
            "raw": is_true ? "true" : "false",
        },
    }
}
