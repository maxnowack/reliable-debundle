function n(param) {
  if (param === 0)
    return 3;
  return function () {
    require('./0');
  };
}
var m = n()();