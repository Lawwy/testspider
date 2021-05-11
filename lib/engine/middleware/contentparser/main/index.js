var parser = require('../../../../parser/parser.js');
var debug = require('debug')('mydebug:contentparse');

module.exports = contentparse;

function contentparse(opts, next) {
  debug('contentparse');
  var resp = opts.response;
  var rules = opts.content_parse_rule;
  if (!resp || !resp.body || !rules || !rules.length) {
    return next(null, opts);
  }
  var url = opts.request ? opts.request.url : '';
  var html = resp.body;
  opts.collections = parser.parse(html, rules, url);
  debug('contentparse', opts.collections.length);
  return next(null, opts);
}
