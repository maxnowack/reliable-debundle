require('./0');
function deep1() {
  return function n(param) {
    if (param === 0)
      return 'from the deep2 n, not require n';
    return function () {
      return require('./0');
    };
  };
}
var m = deep1()()();
console.log(m);