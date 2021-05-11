jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
var rewire = require('rewire');
var proxyMw = rewire('../proxy.js');

describe("#basic test", function() {
  it("#test 1", function(done) {
    var data = {};
    data.url = 'http://www.baidu.com';
    data.request = {};
    proxyMw(data, function() {
      expect(data.request.proxy).toBeDefined();
      // expect(data.request.env['http_proxy']).toBeDefined();
      done();
    })
  });
});
