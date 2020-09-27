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

function moveToBottom(node,index,body) {
    insertAsLastChild( deleteMeInArray(node,index,body) ,body)
}

function prependInArray(node, index, body, new_nodes) {
    body.splice(index, 0, ...new_nodes)
}

function insertAsLastChild(new_node, body) {
    body.push(new_node)
}

module.exports = {
    replaceInArray: replaceInArray,
    prependInArray: prependInArray,
    moveToBottom: moveToBottom,
}
