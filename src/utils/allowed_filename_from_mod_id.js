/**
 * in BrowserifyLike webpack bundle.js
 * there are some id like 'v+/5','v+/5'
 * which are not legal for filename
 */

module.exports = function (_id) {
    return typeof (_id) !== 'string' ? _id : _id.replace(/[/]/g, "__");
}