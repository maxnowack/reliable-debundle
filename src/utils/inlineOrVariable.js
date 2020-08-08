function should_replace(replaceConfig) {
  return replaceConfig.includes('inline')
}

function should_add_var(replaceConfig) {
  return replaceConfig.includes('variable')
}

module.exports = {
  should_replace,
  should_add_var
}