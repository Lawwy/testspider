var _ = require('underscore');
var parser = require('../../lib/parser/parser.js');
var downloader = require('../../lib/downloader/index.js');
var cache = [];

module.exports = function(req, res, next) {
  var url = req.body.url;
  var rules = req.body.rules;
  var isDynamic = req.body.isDynamic;
  if (!url || !rules || !rules.length) {
    return res.json({
      success: false,
      message: "parameters wrong"
    })
  }
  var r = _.find(cache, function(item) {
    return item.url == url && item.isDynamic == isDynamic;
  });
  if (r) {
    var html = r.body;
    var rs = parser.parse(html, rules, url);
    var resp = {};
    resp.success = true;
    resp.result = rs;
    return res.send(resp);
  }
  var req = {
    url: url,
    isDynamic: isDynamic
  };
  downloader(req, function(e, resp) {
    if (e) {
      return res.json({
        success: false,
        message: 'download fail'
      })
    }
    console.log('download success');
    var html = resp.body || resp;
    pushCache({
      url: url,
      body: html,
      isDynamic: isDynamic
    });
    var rs = parser.parse(html, rules, url);
    var resp = {};
    resp.success = true;
    resp.result = rs;
    return res.send(resp);
  })

}

function pushCache(obj) {
  if (cache.length < 10) {
    cache.push(obj);
  } else {
    cache.shift();
    cache.push(obj);
  }
}
