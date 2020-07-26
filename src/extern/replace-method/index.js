var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print

module.exports = replacer

class FunctionSameNameInfo {
  constructor(func, hasSameName = null) {
    this.func = func;
    this.hasSameName = hasSameName;
  }
}

class FunctionSameNameVarStack {
  constructor() {
    this.stack = []
  }

  is_empty() {
    return this.stack.length == 0
  }

  add(func, hasSameName = null) {
    if (this.ifSameNameWorking())
      hasSameName = true

    this.stack.push(new FunctionSameNameInfo(func, hasSameName));
  }

  pop() {
    this.stack.pop()
  }

  ifSameNameWorking() {
    return this.stack.length > 0 && this.stack[this.stack.length - 1].hasSameName
  }

  letSameNameVarWorking() {
    this.stack[this.stack.length - 1].hasSameName = true
  }

  log(msg) {
    console.log('[Travel][SameNameVar] ' + msg)
  }

}

function replacer(ast, replaceRequires) {
  if (Buffer.isBuffer(ast)) ast = String(ast)
  if (typeof ast === 'string')
    ast = parse(ast)

  var functionsStack = new FunctionSameNameVarStack();

  // print code, used for debug
  var debug_code = replace.code = function () {
    return print(ast).code
  }
  // why this line?
  // replace.replace = replace

  return replace


  function replace(methodPath, updater) {
    methodPath = Array.isArray(methodPath)
        ? methodPath
        : [methodPath]

    var size = methodPath.length

    visit(ast, {

      visitFunction(path) {

        if (replaceRequires == 'variable') return false;

        // avoid traversing this subtree.
        // return false;

        /**
         * function (e, t, n) {
         *  var u = n(1);
         *  function c(n){   // ★★★ find the var n which has same name with requrie
         *    n(2);
         *  }
         * }
         */

        let hasSameName = functionsStack.is_empty() ? null : path.value.params.some(
            (param) => param.name == methodPath[0])

        if (hasSameName) {
          var code = debug_code(path.value)
          code = code.length > 200 ? code.substring(0, 200) + ' ...' : code;
          functionsStack.log(`A function has a param named ${methodPath[0]} declaraed: ${code} `)
          // return false to
          // indicate that the traversal need not continue any further down this subtree.
          // https://github.com/benjamn/ast-types#ast-traversal
          return false;
        }

        functionsStack.add(path.value, false);

        this.traverse(path)

        functionsStack.pop()
      }

      , visitFunctionDeclaration(path) {
        if (replaceRequires == 'variable') return false;

        var hasSameName = path.value.id.name == methodPath[0]

        this.traverse(path)

        /**
         * Should be underneath `this.traverse(path)`.
         * Otherwise
         *   function n() { return n(0) }
         * would falsely turn to
         *   function n() { return n('./0') }
         * which should be correctly
         *   function n() { return require('./0'); }
         *
         * see test: 7-webpack-SameNameVar-visitFunction-innerFunction-name.js
         */
        if (hasSameName) {
          functionsStack.log(`A function named ${methodPath[0]} declaraed: ${print(path).code} `)
          functionsStack.letSameNameVarWorking();
        }

      }
      , visitVariableDeclaration(path) {
        if (replaceRequires == 'variable') return false;
        /**
         * function (e, t, n) {
         *  var u = n(1);
         *  function c(){
         *    var n =3; // ★★★ find the var n which has same name with requrie
         *  }
         * }
         */
        var hasSameName = path.value.declarations.some(
            (dec) => dec.id.type === 'Identifier' && dec.id.name == methodPath[0]
        )
        if (hasSameName) {
          functionsStack.log(`A var named ${methodPath[0]} declaraed: ${print(path).code} `)
          functionsStack.letSameNameVarWorking();
        }

        this.traverse(path)

      }

      , visitCallExpression(path) {
        // console.log(path)
        const result = size === 1 ? single(path.node) : nested(path.node)

        if (result == 'samename') {
          // return false to
          // indicate that the traversal need not continue any further down this subtree.
          // https://github.com/benjamn/ast-types#ast-traversal
          return false;
        }

        if (result !== undefined) {
          // console.log(result)
          path.replace(result)
        }
        this.traverse(path)
      }
      ,
    });

    return replace

    function single(node) {

      if (functionsStack.ifSameNameWorking()) return 'samename';


      var target = null;

      switch (node.type) {
        case 'CallExpression':
          if (replaceRequires == 'variable') {
            target = node.callee;
          } else {
            // if n.n(x)
            target = node.callee.type == 'MemberExpression' ? node.callee.object : node.callee
          }
          break;

        case 'Identifier':
          if (methodPath[0] !== node.name) return;
          break;

        default:
          return;
      }


      if (target && target.name !== methodPath[0]) return;

      return updater(node)
    }

    function nested(node) {
      if (node.type !== 'CallExpression') return

      var c = node.callee
      var o = node.callee
      var i = size - 1

      if (c.type === 'Identifier') return
      while (c && c.type === 'MemberExpression') {
        o = c
        if (c.computed) return
        if (methodPath[i] !== c.property.name) return
        c = c.object
        i = i - 1
      }

      if (!o.object || !o.object.name) return
      if (o.object.name !== methodPath[0]) return

      return updater(node)
    }
  }
}

