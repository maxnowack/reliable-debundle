const acorn = require('acorn');
const _utils = require('../utils/visitor_utils')

var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


var get_node_code = require('../utils/get_node_code');

var target_regexp = new RegExp(/r\.bind\(null, "([^"]+)"\)/);

module.exports = function (props, config) {
    return v
}

var all_mod_by_bind = [];

function v(path, _replaer_requires) {
    if (path.node.type !== 'CallExpression') return
    var target, parentFunction, new_, mod_name, result, new_require_statement, try_statement,try_statement_str;

    if (target = get_target(path)) {

        mod_name = target[1]

        if (all_mod_by_bind.indexOf(mod_name) === -1) {

            parentFunction = _utils.get_parent_function(path, 0, 15);
            if (parentFunction) {
                all_mod_by_bind.push(mod_name)
                new_ = build_require(mod_name)
                result = _replaer_requires(new_, null);
                new_require_statement = {

                    type: 'ExpressionStatement',
                    expression: result
                }

                try_statement_str = `
                        try {
                            ${get_node_code(new_require_statement)}
                        } catch (e) {
                            console.log('module "${mod_name}" should be fetched asyned from server')
                        }
                `
                try_statement = acorn.parse(try_statement_str, {})
                parentFunction.body.body.push(try_statement.body[0])
            }

        }


    }

}

const max_try_times = 10;

function build_require(mod_name) {
    return {
        // type: 'ExpressionStatement',
        // expression: {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'r',
        },
        arguments: [
            {
                type: 'Literal',
                value: mod_name,
                raw: mod_name,
            }
        ]
        // }


    }
}

function get_Declaration_or_Statement(path, try_time) {
    if (try_time > max_try_times) return null;

    if (path.parent && [
        'VariableDeclaration', 'FunctionDeclaration', 'ClassDeclaration',
        'ExpressionStatement', 'ReturnStatement',
    ].indexOf(path.parent.node.type) !== -1) {
        return path.parent.node
    } else
        return get_parent_function(path.parent, try_time + 1)

}

function get_target(path, regexp) {
    var target, contents = get_node_code(path.node);
    if ((target = contents.match(target_regexp)) !== null) {
        console.log(`convertRequireBind found require.bind(null,"${target[1]}")`)
        return target;
    }
    return false;
}
