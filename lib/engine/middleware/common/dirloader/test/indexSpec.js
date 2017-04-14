var path = require('path');
var dirloader = require('../index.js');

xdescribe("#test", function() {
  it("collections", function() {
    var collects = dirloader(__dirname + '/data/middleware');
    expect(collects.main.name).toEqual('download');
    expect(collects.post['redirect']).toBeDefined();
    expect(collects.pre['userAgent']).toBeDefined();
  });
});

describe('#test', function() {
  it("collections", function() {
    var collects = dirloader(__dirname + '/data/mw');
    expect(collects.main).toBeDefined();
    expect(collects.mw1).toBeDefined();
    expect(collects.mw2).toBeDefined();
  });
});
