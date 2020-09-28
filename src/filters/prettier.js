const prettier = require("prettier");


var opts={
    parser: "babel"
};

module.exports = function (props, config) {
    delete props.enable
    Object.assign(opts,props);
    return f
}

function f(str) {
    return prettier.format(str,opts);
}
