![Debundle](debundle_logo.png)

# scil

## similar projects
- [Debundle, V2](https://github.com/1egoman/debundle/tree/v2)
- [retidy](https://github.com/Xmader/retidy/issues/1)

## update

1. 2020.07.16 merge from [hectorqin/debundle](https://github.com/hectorqin/debundle) 
  1. use `config.moduleAst = ["body", 0, "expression", "argument", "arguments", 0];` for webpack,   
instead of `["body", 0, "expression", "arguments", 0];`.   
file: `src/index.js`
  2. use `recast.types.visit` instead of `recast.types.traverse`.   
file: `src/extern/replace-method/index.js`

2. v0.5.3.1 support windows os dir style using `path.normalize`.

3. v0.5.3.2 able to parse `n.d` to `require.d`

4. v0.5.3.3 support `"replaceRequires": "inline",`  in the situation [SameNameVar](#SameNameVar)  

5. v0.5.3.4 support `"replaceRequires": "inline,variable",` and config `keepArgumentsDeeperThan`

6. v0.5.3.5 support `"fileExt":".js"`. `"1": "tool/str.js"` would save `n(1)` as `tool/str.js`, not `tool/str.js/index.js`

## preferable configuration for webpack

The simplest way is use `"replaceRequires": "variable",` but in the produced js files,   
`n(1)` would not support code jumping in Intellij Idea family products currently.
To use code jumping, improve Idea, or use `"replaceRequires": "inline,variable",`

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
  "knownPaths": {}
}
```

Always use `variable` for `replaceModules` and `replaceExports`. Because `inline` for both is not supported fully, most times
`e` and `t` would not be replaced.

### scil/debundle support replacing `n` as a function parameter

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
      }.call(t, n, t, e)  // n is `require`,  e is mudule  of parameters of a level 2 function

      void 0 === r || (e.exports = r)  // e is mudule
    }()
  }
```

By default, scil/debundle only replace the parameter `n` with level 1 function. To replace `n` with level 2 function, set
```
  "keepArgumentsDeeperThan":2,
```

### curbs on `"replaceRequires": "inline",` 
In old debundle,`inline` tends to replace all `n` with `require` in a module function `function (e, t ,n)`. How to limit it?

#### "keepDeeperThan" provided for users

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

#### inherent limitation by scil/debundle: SameNameVar

And an extra config "inDescendantsOfSameNameDeclaraton"

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

## tools

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

# debundle

This is a tool built to unpack javascript bundles prudiced by webpack and browserify.


---

## Why would I want to debundle my code?
Reasons vary, but this tool was originally developed to help me with a reverse engineering project.
Needless to say, sifting through minified bundles to try and figure out how a service works isn't
fun and is a lot easier when that bundle is broken into files and those files have semantic names. 

## Installation
```
npm i -g debundle
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

# Configuration

## Simple configuration
```
{
  "type": "browserify",
  "entryPoint": 1,
  "knownPaths": {}
}
```

(To debundle a simple Webpack bundle, replace `browserify` the above configuration with `webpack`)

A configuration can have a number of flags - they are documented in [DOCS.md](DOCS.md).

# FAQ

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
