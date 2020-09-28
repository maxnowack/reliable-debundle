const prettier = require("prettier");


var opts;

module.exports = function (props, config) {
    delete props.enable
    opts=props;
    return f
}

function f(str) {
    return prettier.format(str,opts);
}
