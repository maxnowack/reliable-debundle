/**
 * in BrowserifyLike webpack bundle.js
 * there are some id like 'v+/5','v+/5'
 * which are not legal for filename
 */

module.exports= function(_id)
{
    return  _id.replace(/[/]/g, "__");
}