var debug = require('debug')('mydebug:downloadMiddlewares');

module.exports = handleRedirect;

function handleRedirect(data, next) {
  var resp = data.response;
  debug('handleRedirect');
  if (!resp) {
    return next();
  }
  if (resp.statusCode == 301 || resp.statusCode == 302) {
    resp.redirect = resp.headers['location'];
    var e = new Error('redirect');
    e.type = 'redirect';
    return next(e);
  }
  return next();
}
