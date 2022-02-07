const filename_from_mod_id = require("../utils/allowed_filename_from_mod_id");

const replace = require('../extern/replace-method');

// Webpack debundling shim
// Here's what a webpack bundle looks like:
//
// (function(modules) {
//   // webpack require shim is here
// })([
//   function(module, exports, __webpack_require__) {
//     var foo = __webpack_require__(2); // The index of the item to pull in within the array
//   },
//   function(module, exports, __webpack_require__) {
//     "I am foo!";
//   }
// ])
function webpackDecoder(moduleArrayAST, knownPaths) {
  // Ensure that the bit of AST being passed is an array
  // if (moduleArrayAST.type !== 'ArrayExpression') {
  //   throw new Error(`The root level IIFE didn't have an array for it's first parameter, aborting...`);
  // }

  switch (moduleArrayAST.type) {
    case 'ArrayExpression':
      return moduleArrayAST.elements.map((moduleDescriptor, id) => {
        return {
          id,
          code: moduleDescriptor,
        };
      }).filter(i => i.code);
    case 'ObjectExpression':
      console.log(`The First parameter of The root level IIFE is of type object, like browserify.`);
      return webpackBrowserifyLikeDecoder(moduleArrayAST,knownPaths);
    default:
      throw new Error(`The root level IIFE didn't have an array or object for it's first parameter, aborting...`);

  }

}

function webpackBrowserifyLikeDecoder(moduleArrayAST, knownPaths) {

  return moduleArrayAST.properties.map(moduleDescriptor => {

    if (moduleDescriptor.type !== 'Property') {
      throw new Error(`The module array AST doesn't contain a Property, make sure that the first argument passed to the rool level IIFE is an object.`);
    }

    // Extract the identifier used by the module within the bundle
    let id = moduleDescriptor.key.value || moduleDescriptor.key.name;
    console.log(`* Discovered module ${id}`);

    if (!['FunctionExpression', 'ArrowFunctionExpression'].includes(moduleDescriptor.value.type)) {
      throw new Error(`Module ${id} has a valid key, but maps to something that isn't a function. ${moduleDescriptor.value.type}`);
    }

    // Extract the function that wraps the module.
    let moduleFunction = moduleDescriptor.value;
    return {
      id,
      code: moduleFunction,

    }

  });
}

function getModuleFileName(node, knownPaths) {
  let id = node.arguments[0].raw;
  return knownPaths[id] ? knownPaths[id] : `./${filename_from_mod_id(id)}`;
}

module.exports = webpackDecoder;
