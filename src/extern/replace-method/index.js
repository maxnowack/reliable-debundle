var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print

module.exports = replacer

class FunctionSameNameVarInfo {
  constructor(func, hasSameNameVar = null) {
    this.func = func;
    this.hasSameNameVar = hasSameNameVar;
  }
}

class FunctionSameNameVarStack {
  constructor() {
    this.stack = []
  }

  is_empty() {
    return this.stack.length == 0
  }

  add(func, hasSameNameVar = null) {
    this.stack.push(new FunctionSameNameVarInfo(func, hasSameNameVar));
  }

  pop() {
    this.stack.pop()
  }

  ifSameNameVarWorking() {
    return this.stack[this.stack.length - 1].hasSameNameVar
  }

  letSameNameVarWorking() {
    this.stack[this.stack.length - 1].hasSameNameVar = true
  }

  log(msg) {
    console.log('[Travel][SameNameVar] ' + msg)
  }

}

function replacer(ast) {
  if (Buffer.isBuffer(ast)) ast = String(ast)
  if (typeof ast === 'string')
    ast = parse(ast)

  var functionsStack = new FunctionSameNameVarStack();

  // print code, used for debug
  var debug_code = replace.code = function() {
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

        let hasSameNameVar = functionsStack.is_empty() ? null : path.value.params.some(
            (param) => param.name == methodPath[0])

        if (hasSameNameVar) {
          functionsStack.log(`A function has a param named ${methodPath[0]} declaraed: ${debug_code(path.value)} `)
          // return false to
          // indicate that the traversal need not continue any further down this subtree.
          // https://github.com/benjamn/ast-types#ast-traversal
          return false;
        }

        functionsStack.add(path.value, false);

        this.traverse(path)

        functionsStack.pop()
      }

      , visitVariableDeclaration(path) {
        /**
         * function (e, t, n) {
         *  var u = n(1);
         *  function c(){
         *    var n =3; // ★★★ find the var n which has same name with requrie
         *  }
         * }
         */
        var hasSameNameVar = path.value.declarations.some(
            (dec) => dec.id.type === 'Identifier' && dec.id.name == methodPath[0]
        )
        if (hasSameNameVar) {
          functionsStack.log(`A var named ${methodPath[0]} declaraed: ${print(path).code} `)
          functionsStack.letSameNameVarWorking();
          // return false to
          // indicate that the traversal need not continue any further down this subtree.
          // https://github.com/benjamn/ast-types#ast-traversal
          return false;
        }

        this.traverse(path)

      }

      , visitCallExpression(path) {
        // console.log(path)
        const result = size === 1 ? single(path.node) : nested(path.node)

        if(result == 'savenamevar'){
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

      if (functionsStack.ifSameNameVarWorking()) return 'savenamevar';

      if (node.type !== 'CallExpression' && node.type !== 'Identifier') return;

      // if (node.type === 'CallExpression' && methodPath[0] !== node.callee.name) return;
      if (node.type === 'CallExpression') {
        if (node.callee.type == 'MemberExpression') {
          //  n.n(x)
          if (node.callee.object && methodPath[0] !== node.callee.object.name) {
            return;
          }
        } else if (methodPath[0] !== node.callee.name) return;
      }

      if (node.type === 'Identifier' && methodPath[0] !== node.name) return;

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

