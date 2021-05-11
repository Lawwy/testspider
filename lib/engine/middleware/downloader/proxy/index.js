var debug = require('debug')('mydebug:downloadMiddlewares');
module.exports = setProxy;

function setProxy(data, next) {
  var url = data.url;
  var request = data.request;
  var addition = data.request_options;
  if (!request || !url || !addition || !addition.proxy) {
    return next();
  }
  debug('setProxy');
  request.proxy = addition.proxy;
  return next();
}
