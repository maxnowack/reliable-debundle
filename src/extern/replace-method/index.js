var recast = require('recast')
var visit = recast.types.visit
var build = recast.types.builders
var parse = recast.parse
var print = recast.print

var prompt = require('prompt-sync')();

module.exports = replacer

function debug_code(node) {
  return print(node).code
}

class FunctionSameNameInfo {
  constructor(func, hasSameNameVarOrParam = false, funcDeclarationWithSameName = null) {
    this.func = func;
    this.hasSameNameVarOrParam = hasSameNameVarOrParam;
    this.funcDeclarationWithSameName = funcDeclarationWithSameName;

  }
}

class FunctionSameNameStack {
  constructor(methodPath,keepDeeperThan = 999) {
    this.methodPath = methodPath;
    this.keepDeeperThan = keepDeeperThan
    this.stack = []
  }

  is_empty() {
    return this.stack.length == 0
  }

  add(func, hasSameNameVarOrParam = null, funcDeclarationWithSameName = null) {
    if (this.stack.length > 0) {
      if (!hasSameNameVarOrParam)
        hasSameNameVarOrParam = this.stack[this.stack.length - 1].hasSameNameVarOrParam

      if (!funcDeclarationWithSameName) {
        funcDeclarationWithSameName = this.stack[this.stack.length - 1].funcDeclarationWithSameName
      }

    }

    this.stack.push(new FunctionSameNameInfo(func, hasSameNameVarOrParam, funcDeclarationWithSameName));
  }

  pop() {
    this.stack.pop()
  }

  sameNameVarOrParamIsWorking() {
    return this.stack.length > 0 && this.stack[this.stack.length - 1].hasSameNameVarOrParam
  }

  getFuncDeclarationWithSameName() {
    // why >2? because a function named `n` must be at least of level 2
    // webpack would not allocate level 1 functions  the name `n` for naming conflict with require `n`
    return this.stack.length > 2 && this.stack[this.stack.length - 2].funcDeclarationWithSameName
  }

  willTooDeep() {
    return this.stack.length >= this.keepDeeperThan + 1
  }

  letSameNameWorking() {
    this.stack[this.stack.length - 1].hasSameNameVarOrParam = true
  }

  log(msg) {
    console.log('[Travel][SameNameVar] ' + msg)
  }

}

function replacer(ast, config) {
  if (Buffer.isBuffer(ast)) ast = String(ast)
  if (typeof ast === 'string')
    ast = parse(ast)

  var replaceRequires = config.replaceRequires


  // print code, used for debug
  replace.code = debug_code
  // why this line?
  // replace.replace = replace

  return replace


  function replace(methodPath, updater) {
    methodPath = Array.isArray(methodPath)
        ? methodPath
        : [methodPath]

    var size = methodPath.length

    var functionsStack = new FunctionSameNameStack(methodPath,config.keepDeeperThan);

    visit(ast, {

      // This method will be called for any node whose type is a subtype of
      // Function (e.g., FunctionDeclaration, FunctionExpression, and
      // ArrowFunctionExpression).
      visitFunction(path) {

        // avoid traversing this subtree.
        if (replaceRequires == 'variable') return false;

        if (functionsStack.willTooDeep()) return false;

        // type FunctionDeclaration has the prop id
        var boolDeclarationWithSameName = path.value.id ? path.value.id.name == methodPath[0] : false;

        /**
         * function (e, t, n) {
         *  var u = n(1);
         *  function c(n){   // ★★★ find the var n which has same name with requrie
         *    n(2);
         *  }
         * }
         */

        let paramHasSameName = functionsStack.is_empty() ? null : path.value.params.some(
            (param) => param.name == methodPath[0])

        if (paramHasSameName) {
          var code = debug_code(path.value)
          code = code.length > 200 ? code.substring(0, 200) + ' ...' : code;
          functionsStack.log(`A function has a param named ${methodPath[0]} declaraed: ${code} `)
          // return false to
          // indicate that the traversal need not continue any further down this subtree.
          // https://github.com/benjamn/ast-types#ast-traversal
          return false;
        }

        functionsStack.add(path.value, false, boolDeclarationWithSameName?path.value:null);

        this.traverse(path)

        functionsStack.pop()


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
        if (boolDeclarationWithSameName) {
          functionsStack.log(`A function named ${methodPath[0]} declaraed: ${print(path).code} `)
          functionsStack.letSameNameWorking();
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
        var varHasSameName = path.value.declarations.some(
            (dec) => dec.id.type === 'Identifier' && dec.id.name == methodPath[0]
        )
        if (varHasSameName) {
          functionsStack.log(`A var named ${methodPath[0]} declaraed: ${print(path).code} `)
          functionsStack.letSameNameWorking();
        }

        this.traverse(path)

      }

      , visitCallExpression(path) {
        // console.log(path)
        const result = size === 1 ? single(path.node) : nested(path.node)

        if (result == 'false') {
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

    // why this line? debug?
    // return replace

    function single(node) {

      var target = null;
      var fun = null;

      switch (node.type) {
        case 'CallExpression':

          if (replaceRequires == 'inline') {
            if (functionsStack.sameNameVarOrParamIsWorking()) return 'false';

            if (fun = functionsStack.getFuncDeclarationWithSameName()) {
              var inDescendantsOfSameNameDeclaraton =
                  config.inDescendantsOfSameNameDeclaraton == 'ask' ? ask(node, fun,methodPath[0]) : config.inDescendantsOfSameNameDeclaraton


              if (inDescendantsOfSameNameDeclaraton == 'keep') {
                return 'false';
              }
            }

            // if n.n(x)
            target = node.callee.type == 'MemberExpression' ? node.callee.object : node.callee

          } else if (replaceRequires == 'variable') {
            target = node.callee;
          } else {
            throw new Error("replaceRequires should be 'inline' or 'variable'")
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

function ask(code,fun, method) {

  console.log("ask")
  console.log("found")
  console.log(debug_code(code))
  console.log("in this function:")
  console.log(debug_code(fun))
  var ans = prompt(`How to handle this ${method}? replace|[keep]`, 'keep');
  return ans;
}

