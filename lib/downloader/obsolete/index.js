var dw = require('./lib/download/index.js');

module.exports = download;

function download(reqOpts, cb) {
  var downloadFunc = dw(reqOpts.isDynamic);
  downloadFunc(reqOpts, function(e, body, resp) {
    if (e) {
      e.source = 'download';
      return cb(e);
    } else {
      return cb(null, resp || body);
    }
  })
}
