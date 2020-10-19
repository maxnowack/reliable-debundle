const acorn = require('acorn');
const _utils = require('../utils/visitor_utils')
const _getModuleLocation = require('../utils/getModuleLocation');
const get_relative_moduleLocation = _getModuleLocation.get_relative_moduleLocation
const found_location = _getModuleLocation.found_location

var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print


var get_node_code = require('../utils/get_node_code');

/**
 *  n.t.bind(null, './i8i4', 7)
 *  n.bind(null, 'J9+s')
 */
var target_regexp = new RegExp(/\w(.t)?\.bind\(null, ["']([^"]+)["']/);

module.exports = function (props, config) {
    return v
}

var all_mod_by_bind = [];

/**
 *
 * case:
 *  n.t.bind(null, './i8i4', 7)
 *  n.bind(null, 'J9+s')
 */

function v(
    mod, modules, knownPaths, entryPointModuleId,
    path, _replaer_requires, update_RequireVar, should_replace, replaceRequires, requireFunctionIdentifier) {
    if (path.node.type !== 'CallExpression') return false;
    var target, parentFunction, new_, mod_name, result, new_require_statement, try_statement, try_statement_str,
        moduleLocationOrOriginalNode,mod_location_or_name;

    if (target = get_target(path)) {

        method_name = target[1]? target[1].substr(1):null // t in  n.t.bind(null, './i8i4', 7)
        mod_name = target[2]

        moduleLocationOrOriginalNode = get_relative_moduleLocation(path.node, mod, mod_name, modules, knownPaths, entryPointModuleId)
        mod_location_or_name = found_location(moduleLocationOrOriginalNode)? moduleLocationOrOriginalNode: mod_name;

        /**
         * append require(xxx) to parentFuncion.
         * do nothing on browses, just a trick to make webpack to collect mod with name ${mod_name}
         */
        if (all_mod_by_bind.indexOf(mod_name) === -1) { // ensure to no repeat

            parentFunction = _utils.get_parent_function(path, 0, 15);
            if (parentFunction) {
                all_mod_by_bind.push(mod_name)

                // new_ = build_require(mod_name)
                // result = _replaer_requires(new_, null);
                // new_require_statement = {
                //
                //     type: 'ExpressionStatement',
                //     expression: result
                // }

                try_statement_str = `
                        try {
                        true; // do nothing on browses, just a trick to make webpack to collect mod with name ${mod_name}
                        } catch (e) {
                            require('${mod_location_or_name}');
                        }
                `

                try_statement = acorn.parse(try_statement_str, {})
                parentFunction.body.body.push(try_statement.body[0])
            }

        }


        // location , or origianlNode which return false and give back the control to TransformRequires
        // if(!found_location(moduleLocationOrOriginalNode)) return false;


        // return {
        //     scil_debundle: "by_visitor",
        //     type: 'CallExpression',
        //     // If replacing all require calls in the ast with the identifier `require`, use
        //     // that identifier (`require`). Otherwise, keep it the same.
        //     callee: should_replace(replaceRequires) ? {
        //         type: 'Identifier',
        //         name: 'require',
        //     } : requireFunctionIdentifier,
        //     arguments: [
        //         // Substitute in the module location on disk
        //         {type: 'Literal', value: mod_location, raw: mod_location},
        //     ],
        // }


        return method_name ? {
            scil_debundle: "by_visitor",
            type: 'CallExpression',
            "callee": {
                "type": "MemberExpression",
                "property": path.node.callee.property,
                "object":{
                    "type": "MemberExpression",
                    "object": update_RequireVar(replaceRequires, requireFunctionIdentifier),
                    "property":{
                        "type":"Identifier",
                        "name":method_name
                    }
                }

            },
            arguments: [
                {type: 'Literal', value: null, raw: "null"},
                {type: 'Literal', value: mod_location_or_name, raw: mod_location_or_name},
                ...path.node.arguments.slice(2),
            ],
        } : {
            scil_debundle: "by_visitor",
            type: 'CallExpression',
            "callee": {
                "type": "MemberExpression",
                "property": path.node.callee.property,
                "object": update_RequireVar(replaceRequires, requireFunctionIdentifier),
            },
            arguments: [
                {type: 'Literal', value: null, raw: "null"},
                {type: 'Literal', value: mod_location_or_name, raw: mod_location_or_name},
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
