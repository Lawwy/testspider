var dw = require('../../../../downloader/download.js');
var debug = require('debug')('mydebug:downloadMiddlewares');

module.exports = download;

function download(opts, next) {
  if (!opts || !opts.request) {
    return next();
  }
  debug('download', opts.request);
  var req = opts.request;
  var addition = opts.request_options || {};
  var downloadFunc = dw(addition.isDynamic);
  downloadFunc(req, function(e, resp) {
    debug('get response');
    if (e) {
      e.type = 'download_fail';
      return next(e);
    } else {
      opts.response = resp;
      return next();
    }
  })
}
