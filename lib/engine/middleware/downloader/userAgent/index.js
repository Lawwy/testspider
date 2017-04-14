module.exports = setUserAgent;

function setUserAgent(data, next) {
  var url = data.url;
  var request = data.request;
  if (!request || !url) {
    return next();
  }
  request.headers = request.headers || {};
  request.headers['user-agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36";
  // request.headers['connection'] = "keep-alive";
  return next();
}
