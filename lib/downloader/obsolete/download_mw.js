var dw = require('./lib/download/index.js');
var debug = require('debug')('mydebug:dw');

module.exports = download;

function download(opts, next) {
  if (!opts || !opts.request) {
    return next();
  }
  debug('download', opts.request);
  var req = opts.request;
  var downloadFunc = dw(req.isDynamic);
  downloadFunc(req, function(e, body, resp) {
    debug('download', 'get response');
    if (e) {
      e.type = 'download_fail';
      return next(e);
    } else {
      opts.response = resp;
      return next();
    }
  })
}
