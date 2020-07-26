var te = function (e) {
  var n = t.prototype;
  n.values = function () {
    var e, n = this.keys();
    e.next = function () {
      var e = n.next();
    };
    return e;
  };
  return t;
}(Map);