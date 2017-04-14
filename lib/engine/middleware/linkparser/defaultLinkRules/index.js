module.exports = getDefaultLinkRules;

function getDefaultLinkRules(data, next) {
  if (data.link_parse_rule && data.link_parse_rule.length) {
    return next();
  }
  data.link_parse_rule = [{
    name: 'a',
    mode: 'css',
    type: 'link',
    expression: 'a',
    target: '@href'
  }];
  return next();
}
