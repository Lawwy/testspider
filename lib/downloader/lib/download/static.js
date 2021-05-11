var request = require('request');

module.exports = download;

function download(opts, cb) {
  var options = opts || {};
  options.method = options.method || 'GET';
  options.url = options.url;
  options.headers = options.headers || {
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36",
    "connection": "keep-alive"
  };
  request(options, function(e, resp, body) {
    return cb(e, body, resp);
  })
}
