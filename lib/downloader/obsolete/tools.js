var _ = require('underscore');
var cheerio = require('cheerio');

module.exports = linkparse;

function linkparse(page, rules, domain) {
  var links = [];
  rules.forEach(function(rule) {
    if (rule.mode != 'reg')
      return;
    var reg = new RegExp(rule.expression, 'g');
    var res;
    while (res = reg.exec(page)) {
      links.push(res[1] || res[0]);
    }
  });
  links = _.uniq(links);
  return links || [];
}
