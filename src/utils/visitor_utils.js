/**
 * replace an element of an array with some new_nodes
 * @param node
 * @param new_nodes Array
 * @param body Array
 */
function replaceInArray(node, index, body, new_nodes) {
    body.splice(index, 1, ...new_nodes)
}

function deleteMeInArray(node, index, body) {
    return body.splice(index, 1)[0]
}

function moveToBottom(node, index, body) {
    insertAsLastChild(deleteMeInArray(node, index, body), body)
}

function prependInArray(node, index, body, new_nodes) {
    body.splice(index, 0, ...new_nodes)
}

function insertAsLastChild(new_node, body) {
    body.push(new_node)
}

const max_try_times = 5;

function get_parent_function(path, try_time, max) {
    if (try_time > (max || max_try_times)) return null;

    if (path.parent && path.parent.node.type === 'FunctionExpression') {
        return path.parent.node
    } else
        return get_parent_function(path.parent, try_time + 1, max)

}

module.exports = {
    replaceInArray: replaceInArray,
    prependInArray: prependInArray,
    moveToBottom: moveToBottom,
    get_parent_function: get_parent_function,
}
