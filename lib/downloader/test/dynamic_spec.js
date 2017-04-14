jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
var download = require('../dynamic.js');

describe("dynamic page download test", function() {
  it("download angular page", function(done) {
    var req = {};
    req.url = "https://docs.angularjs.org/api";
    req.headers = {
      "User-Agent": "phantom"
    }
    download(req, function(e, resp) {
      expect(e).toBeNull();
      var page = resp.body;
      expect(page.indexOf("ng (core module)")).toBeGreaterThan(-1);
      done();
    })
  });

  it("brower fail", function(done) {
    var req = {};
    req.url = "http://www.djlkjnraojc.com";
    download(req, function(e, resp) {
      expect(e).toBeDefined();
      done();
    })
  })
});
