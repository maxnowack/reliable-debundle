var recast = require('recast')
var print = recast.print

module.exports = function (node) {
    return print(node).code
}

