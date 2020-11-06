![Debundle](debundle_logo.png)

This is a tool built to unpack javascript bundles prudiced by webpack and browserify.

# scil/reliable-debunble

## Installation
```
npm i -g @scil/reliable-debundle
```

## Running
```bash
$ debundle
Usage: debundle [input file] {OPTIONS}

Options:
   --input,  -i  Bundle to debundle
   --output, -o  Directory to debundle code into.
   --config, -c  Configuration file

$ curl https://raw.githubusercontent.com/1egoman/debundle/master/test_bundles/browserify/bundle.js > bundle.js
$ curl https://raw.githubusercontent.com/1egoman/debundle/master/test_bundles/browserify/debundle.config.json > debundle.config.json
$ cat debundle.config.json
{
  "type": "browserify",
  "knownPaths": {}
}
$ debundle -i bundle.js -o dist/ -c debundle.config.json
$ tree dist/
dist/
├── index.js
└── node_modules
    ├── number
    │   └── index.js
    └── uuid
        ├── index.js
        ├── lib
        │   ├── bytesToUuid.js
        │   └── rng.js
        ├── v1.js
        └── v4.js
4 directories, 7 files
```

## Preferable configuration for webpack

The simplest way is use `"replaceRequires": "variable",`   
but in the produced js files,  `n(1)` would not support code jumping in Intellij Idea family products currently.  
To use code jumping, wait for a better Intellij Idea, or use `"replaceRequires": "inline,variable",`

```json
{
  "type": "webpack",
  "entryPoint": 0,
  "moduleAst": ["body", 0, "expression", "argument", "arguments", 0],

  "keepDeeperThan": 3,
  "inDescendantsOfSameNameDeclaraton": "keep",

  "replaceRequires": "inline,variable",
  "replaceModules": "variable",
  "replaceExports": "variable",
  "variableType": "const",

  "require_visitors": {
    "convertRequireBind": {
      "enable": 1
    }
  },

  "other_visitors": {
    "friendlyBool": {
      "enable": 1
    },
    "friendlyExports": {
      "enable": 1,
      "regexp": "^require\\.d\\(t, ['\"](\\w+?)['\"],\\s*function\\s*\\(\\)\\s*\\{\\s+return ([^;]+);\\s+\\}\\)"
      "deleteOld": 0
      },
    "reduceComma": {
      "enable": 1,
      "support_nest": 0
    }
  },

  "replaceResultString":{
    "from": "e.exports = require('electron');",
    "to": "//e.exports = require('electron');",
    "regexp": 0,
    "all": 1
    },

  "filters": {
    "js-beautify": {
      "enable": 0,
      "break_chained_methods": true
    },
    "prettier": {
      "enable": 1
    }
    },

  "knownPaths": {}
}
```

Always use `variable` for `replaceModules` and `replaceExports`. Because `inline` for both is not supported fully, most times
`e` and `t` would not be replaced.

### `replaceResultString` used to replace the contents string before `writeToDisk`. 

### `friendlyBool` can change `!0` to `true`.

### `reduceComma` can change `return m,n;` to `m; return n;`. `"support_nest": 1` is useful for 
``` 
return function(){return m1,m2}, n;
```
but maybe not fully guaranteed because `reduceComma` change ast during tree travel.   
Maybe a better ways is to set multiple visitors for `reduceComma`
``` 
    "reduceComma": {
      "enable": 1,
      "support_nest": 0
    },
    "reduceComma": {
      "enable": 1,
      "support_nest": 0
    }
```
      

### `friendlyExports` can read 
``` 
require.d(t, 'c', function () {
  return F1;
}), require.d(t, 'd', function () {
  return F2;
});
```
and **at the bottom of a module** put following code
``` 
exports.c = F1;
exports.d = F2;
```
There code allow you jump and refactor in Intellij Idea products.

'"deleteOld": 1' would drop origian code, providing more terse code, but cause errors in the following case
``` 
r.d(t, "o", function () { return o; });
r.d(t, "setup", function () { return setup; });
let o = 'not ready';
const setup = () => ( o = 'ok' );
```
when this module is exectuted, `o==="not ready"`. but in a real-life app, after `setup()`, `o==="not ready"`.  
If `r.d(t, "o", function () { return o; });`  is dropped, `o` is alway equal to `"not really"`.
      

### `convertRequireBind` can support modules requied async

It would produce new statement `require('./bcs1');` from  `require.bind(null, 'bcs1')`

`require_visitors` works for the node found related with `require`. This type of visitors can created new code and find and replace `require` in the new code.

## Updates by scil

1. 2020.07.16 merge from [hectorqin/debundle](https://github.com/hectorqin/debundle) 
  1. use `config.moduleAst = ["body", 0, "expression", "argument", "arguments", 0];` for webpack,   
instead of `["body", 0, "expression", "arguments", 0];`.   
file: `src/index.js`
  2. use `recast.types.visit` instead of `recast.types.traverse`.   
file: `src/extern/replace-method/index.js`

2. v0.5.3.1 support windows os dir style using `path.normalize`.

3. v0.5.3.2 able to parse `n.d` to `require.d`

4. v0.5.3.3 support `"replaceRequires": "inline",`  in the situation [SameNameVar](#3.2-inherent-limitation-by-scildebundle-samenamevar)  

5. v0.5.3.4 support `"replaceRequires": "inline,variable",` and config `keepArgumentsDeeperThan`

6. v0.5.3.5 support `"fileExt":".js"`.   
`"1": "tool/str.js"` would save `n(1)` as `tool/str.js`, not `tool/str.js/index.js`

7. v0.5.3.6 support `"replaceResultString"`.   

8. v0.5.3.7 support `friendlyExportsFrom`.

9. v0.5.3.8 support `friendlyBool`.

10. v0.5.3.9 support `reduceComma`.

11. v0.5.3.10 support `filters`. used to change produced string. added a new filters `prettier`.

12. v0.5.3.11 support `support_nest`.

## Efforts to be reliable?

### 1. support `"replaceRequires": "inline,variable",`

```javascript

function (e, t, n) {  // n is require.
  n(3);  // n is require
  function x(){
    var n =3;   // this n is not require
  }
}
```
In old 1egoman/debundle, `"replaceRequires": "inline"` would replace all `n` with `require` in a module function `function (e, t ,n)`.  How to limit it?

Reliable-debundle not only support `inline` or `variable`, but also both `inline` and `variable` which could produce following code:
```
  const n = require;
  require('./3');
  function x(){
    var n =3;   // this n is not require
  }
```

### 2. scil/reliable-debundle support replacing `n` when n is used as a function parameter

```javascript

  function (e, t, n) {  // deep: 0
    "use strict";
    /// n:263
    var r;


    void 0 === (o = "function" == typeof (r = function () { // deep: 1
        }
    ) ? r.call(t, n, t, e) : r) || (e.exports = o) // n is `require` as a parameter of a level 1 function

    !function () {   // deep: 1

      r = function () {  // deep:2
        return d
      }.call(t, n, t, e)  // n is `require`,  e is module  of parameters of a level 2 function

      void 0 === r || (e.exports = r)  // e is mudule
    }()
  }
```

By default, scil/debundle only replace the parameter `n` with level 1 function. To replace `n` with level 2 function, set
```
  "keepArgumentsDeeperThan":2,
```

### 3. curbs on `"replaceRequires": "inline",` 

In old 1egoman/debundle, `inline` tends to replace all `n` with `require` in a module function `function (e, t ,n)`.  How to limit it?

#### 3.1. "keepDeeperThan" provided for users

`"keepDeeperThan": 2,` would make debundle ignore everything in functions with level 3 or deeper.

see examples 8.0 and 8.1 in test_scil/bundle
  

```javascript
function (e, t, n) {  // deep: 0
    /// as n(1)

    n(0);    // this is require

    function deep1() {   // deep: 1

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
```

#### 3.2. inherent limitation by scil/debundle: SameNameVar

And an extra config "inDescendantsOfSameNameDeclaraton"

When `n` is `require`, there may be another varable which is also named `n` but is not `requrie`. This is **SameNameVar**.

```
  function (e, t, n) {  // ★★★ this n  is  `require`
    var x = n(0);

    function It(e) {
      var n = p(e); // ★★★ this  n  is not `require`, just a SameNameVar. code: `boolVarHasSameName`
      // Prior to v0.5.3.3(official debundle), 
      // you have to use `"replaceRequires": "variable",`, 
      // otherwise you got  `require(99)` from `n(99)`.  
      return n && n(99);
    }

    function b(e, t, n) { // ★★★ this  n  is not `require`, just a SameNameVar. code: `boolParamHasSameName`
        return n(99);
    }

    function c(){    // deep: 1
        function n(){} // ★★★ this  n  is not `require`, just a SameNameVar. code: `boolDeclarationWithSameName`
    }

    function deep1() {   // deep: 1

      return function n(param) {  // deep: 2

        if (param === 0) return 'from the deep2 n, not `require` ';

        return function () {    // deep: 3
          return n(0)  // ★★★ deep2 n, not `require`.  
                       // ★★★ Currently scil/debunble sees it as `require`, 
                       // but adds a extra config `"inDescendantsOfSameNameDeclaraton": "keep",`
                       // or `"inDescendantsOfSameNameDeclaraton": "ask",`
        }
      }
    }


    var m = deep1()()();
  }

```

Related Code:   
`visitFunction` and   
`visitVariableDeclaration` in `src/extern/replace-method/index.js`    

Related Test:   
`3--webpack-SameNameVar-visitVariableDeclaration.js`   
and  `4--webpack-SameNameVar-visitFunction.js`  in `test_scil/bundle`

## Tools

### online tool to try parser
- https://astexplorer.net/ support multiple parsers
- [Esprima parser](https://esprima.org/demo/parse.html)

### libs
- https://github.com/benjamn/recast  
- https://github.com/benjamn/ast-types/blob/master/def/core.ts  

### how to view the code of an ast node?
```
var recast = require('recast');
var print = recast.print;
print(ast_node)
```

## Similar projects
- [Debundle, V2](https://github.com/1egoman/debundle/tree/v2)
- [retidy](https://github.com/Xmader/retidy/issues/1)

---

# Old debundle doc


## Why would I want to debundle my code?
Reasons vary, but this tool was originally developed to help me with a reverse engineering project.
Needless to say, sifting through minified bundles to try and figure out how a service works isn't
fun and is a lot easier when that bundle is broken into files and those files have semantic names. 


## Configuration

### Simple configuration
```
{
  "type": "browserify",
  "entryPoint": 1,
  "knownPaths": {}
}
```

(To debundle a simple Webpack bundle, replace `browserify` the above configuration with `webpack`)

A configuration can have a number of flags - they are documented in [DOCS.md](DOCS.md).

## FAQ

### Is debundling lossless? Ie, if I bundle my code then debundle, will I get the same source that was originally bundled? 

No. There a bunch of metadata that's lost when bundling:
- Any custom `package.json` settings for each `node_module` and the root package.
- In a webpack bundle, the names of modules aren't in the bundle. By default, debundling will produce
files named after the module id (ie, `1.js`) unless [manually overridden](https://github.com/1egoman/debundle/blob/master/DOCS.md#knownpaths-required).
- If your code was minified, the output files from the debundling process will also be minified (ie,
no whitespace, single letter variables, etc). It's up to you to run source through other tools to
make it look nicer.

### My debundled code can't be run!

- Make sure that either when rebundling or running with node that you're using the correct file as
your entrypoint. 
- Read through [all the configuration options](https://github.com/1egoman/debundle/blob/master/DOCS.md). Some of them have caveats.
- You could have run into an edge case that I haven't seen yet. Feel free to open an issue if you believe that to be the case.

### Does this tool support bundles made by tools other than Browserify and Webpack?

Not officially. However, if a bundle shares the same type module layout as Browserify or Webpack it
may be possible to set the [moduleAst](https://github.com/1egoman/debundle/blob/master/DOCS.md#moduleast)
configuration option to point to the location of the modules.


# Contributing
- After cloning down the project, run `npm install` - that should be it.
- Debundler entry point is `./src/index.js` (that's how you run it!)
- A bunch of sample bundles are in `test_bundles/`. A script, `test_bundles/run_test.sh` can run the
  debundler against a given bundle and try to debundle it into `dist/`. (CI will, as part of running
  tests, debundle all the bundles in that folder.)
- Make sure any contribution pass the tests: `npm test`

# Legal note
Some companies specify in their terms of service that their code cannot be "reverse engineered".
Debundling can definitely (depending on how you're using the code) fall under that umbrella.
Understand what you are doing so you don't break any agreements :smile:
