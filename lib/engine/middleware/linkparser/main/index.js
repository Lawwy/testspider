var parser = require('../../../../parser/parser.js');
var debug = require('debug')('mydebug:linkparse');

module.exports = linkparse;

function linkparse(opts, next) {
  debug('linkparse');
  var resp = opts.response;
  var rules = opts.link_parse_rule;
  if (!resp || !resp.body || !rules || !rules.length) {
    return next();
  }
  var url = opts.request ? opts.request.url : '';
  var html = resp.body;
  var rs = parser.parse(html, rules, url);
  var links = gatherlinks(rs);
  opts.links = links || [];
  debug('linkparse', opts.links);
  return next();
}

var gatherlinks = function(lrs) {
  var links = [];
  lrs.map(function(l) {
    return l.result;
  }).forEach(function(arr) {
    links = links.concat(arr)
  })
  return links;
}
