function module(e, t, n) {  // deep: 0
  /// as n(1)

  n(0);    // this is require

  function deep1() {

    return function n(param) {  // deep: 2

      if (param === 0) return 'from the deep2 n, not require n';

      return function () {    // deep: 3
        return n(0)  // deep2 n, not require n
      }
    }
  }


  var m = deep1()()();

  console.log(m);

}

var n = function () {
  console.log('from require')
}

module(1, 1, n)