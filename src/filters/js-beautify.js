const jsbeautifier = require('js-beautify/js')


var opts;

module.exports = function (props, config) {
    delete props.enable
    opts=props;
    return f
}

function f(str) {
    return jsbeautifier.js_beautify(str, opts)
}
