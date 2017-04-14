// jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
var Downloader = require('../downloader');
var EventEmitter = require('events').EventEmitter;

describe('#initial instance', function() {
  it("# new()", function() {
    var downloader = new Downloader();
    expect(downloader instanceof Downloader).toBe(true);
    expect(downloader instanceof EventEmitter).toBe(true);
    expect(Downloader.prototype.hasOwnProperty('download')).toBe(true);
    downloader = null;
  })

  it('# download success', function(done) {
    var downloader = new Downloader();
    var req = {
      url: "https://segmentfault.com/a/1190000002691861"
    }
    downloader.on('download_response', function(resp, dw) {
      expect(resp.success).toBe(true);
      expect(resp.request).toEqual(req);
      expect(resp.url).toEqual("https://segmentfault.com/a/1190000002691861");
      expect(resp.body.indexOf('money.js')).toBeGreaterThan(0);
      done();
    });
    downloader.download(req);
  });

  it('# download false', function(done) {
    var downloader = new Downloader();
    var req = {
      url: "http://www.djlkjnraojc.com"
    }
    downloader.on('download_response', function(resp, dw) {
      expect(resp.success).toBe(false);
      expect(resp.request).toEqual(req);
      expect(resp.url).toEqual("http://www.djlkjnraojc.com");
      expect(resp.body).toBeUndefined();
      done();
    });
    downloader.download(req);
  });

  it('# download with linkparse success', function(done) {
    var downloader = new Downloader();
    var req = {
      url: "https://segmentfault.com/a/1190000002691861"
    };
    var linkRules = [{
      "mode": "reg",
      "expression": "href=\"(https://github.com/totorojs/totoro)\""
    }]
    downloader.on('download_response', function(resp, dw) {
      expect(resp.success).toBe(true);
      expect(resp.request).toEqual(req);
      expect(resp.url).toEqual("https://segmentfault.com/a/1190000002691861");
      expect(resp.body.indexOf('money.js')).toBeGreaterThan(0);
      expect(resp.links.length).toBe(1);
      expect(resp.links[0]).toEqual("https://github.com/totorojs/totoro");
      done();
    });
    downloader.download(req, linkRules);
  });

  it('# download with empty links', function(done) {
    var downloader = new Downloader();
    var req = {
      url: "https://segmentfault.com/a/1190000002691861"
    };
    var linkRules = [{
      "mode": "reg",
      "expression": "href=\"(https://github.com/totdsfeorojs/totoro)\""
    }]
    downloader.on('download_response', function(resp, dw) {
      expect(resp.success).toBe(true);
      expect(resp.request).toEqual(req);
      expect(resp.url).toEqual("https://segmentfault.com/a/1190000002691861");
      expect(resp.body.indexOf('money.js')).toBeGreaterThan(0);
      expect(resp.links.length).toBe(0);
      done();
    });
    downloader.download(req, linkRules);
  });
})
