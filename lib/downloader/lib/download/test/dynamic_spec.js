jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
var download = require('../dynamic2.js');

describe("dynamic page download test", function () {
  it("download angular page", function(done) {
    var url = "https://docs.angularjs.org/api";
    download({url:url},function(e,page) {
      expect(page.indexOf("ng (core module)")).toBeGreaterThan(-1);
      done();
    })
  });
});
