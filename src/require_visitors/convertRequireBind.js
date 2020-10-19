const acorn = require('acorn');
const _utils = require('../utils/visitor_utils')
const _getModuleLocation = require('../utils/getModuleLocation');
const get_relative_moduleLocation = _getModuleLocation.get_relative_moduleLocation

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

/**
 *
 * case: r.bind(null, "bcs1")
 */

function v(
    mod,  modules, knownPaths, entryPointModuleId,
    path, _replaer_requires, update_RequireVar, should_replace,replaceRequires, requireFunctionIdentifier ) {
    if (path.node.type !== 'CallExpression') return false;
    var target, parentFunction, new_, mod_name, result, new_require_statement, try_statement,try_statement_str, moduleLocationOrOriginalNode;

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
                            console.log(e.message); 
                            console.log('Sth wrong with a module whoes origin name is "${mod_name}" which maybe changed by debundle, like "/" to "__"')
                        }
                `
                try_statement = acorn.parse(try_statement_str, {})
                parentFunction.body.body.push(try_statement.body[0])
            }

        }

        moduleLocationOrOriginalNode = get_relative_moduleLocation(path.node,mod, mod_name, modules, knownPaths, entryPointModuleId)

        // location , or origianlNode which return false and give back the control to TransformRequires
        if(typeof(moduleLocationOrOriginalNode)!=='string') return false;

        return {
            scil_debundle: "by_visitor",
            type: 'CallExpression',
            // If replacing all require calls in the ast with the identifier `require`, use
            // that identifier (`require`). Otherwise, keep it the same.
            callee: should_replace(replaceRequires) ? {
                type: 'Identifier',
                name: 'require',
            } : requireFunctionIdentifier,
            arguments: [
                // Substitute in the module location on disk
                {type: 'Literal', value: moduleLocationOrOriginalNode, raw: moduleLocationOrOriginalNode},
            ],
        }


        return {
            scil_debundle: "by_visitor",
            type: 'CallExpression',
            "callee": {
                "type": "MemberExpression",
                "object": update_RequireVar(replaceRequires, requireFunctionIdentifier),
                "property": path.node.callee.property,
            },
            arguments: [
                {type: 'Literal', value: null, raw: "null"},
                {type: 'Literal', value: moduleLocationOrOriginalNode, raw: moduleLocationOrOriginalNode},
            ],
        };

    }

    return false;
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
