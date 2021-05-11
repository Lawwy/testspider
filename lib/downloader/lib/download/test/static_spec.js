jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
var download = require('../static');

describe("static page download test", function() {
  it("normal page", function(done) {
    var url = "https://segmentfault.com/a/1190000002691861";
    download({
      url: url
    }, function(e, page) {
      expect(page.indexOf('money.js')).toBeGreaterThan(0);
      done();
    })
  });

  it("dynamic page", function(done) {
    var url = "https://docs.angularjs.org/api";
    download({
      url: url
    }, function(e, page) {
      expect(page.indexOf("ng (core module)")).toBe(-1);
      expect(page.indexOf("API Reference")).toBeGreaterThan(0);
      done();
    })
  });

  it('wrong page', function(done) {
    var url = "http://www.djlkjnraojc.com";
    download({
      url: url,
      timeout: 10000
    }, function(e, page) {
      // console.error(e);
      expect(e).not.toBeNull();
      done();
    })
  })
});
