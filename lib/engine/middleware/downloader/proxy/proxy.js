var debug = require('debug')('mydebug:downloadMiddlewares');
var ping = require("net-ping");
var session = null;
var parser = require('../../../../parser/parser.js');
var proxyUrls = ["http://www.kuaidaili.com/proxylist/1/", "http://www.kuaidaili.com/proxylist/2/", "http://www.kuaidaili.com/proxylist/3/"]
var proxyList = [];
var request = require('request');
var Q = require('q');
var async = require('async');
var rules = [{
  "name": "record",
  "mode": "css",
  "expression": "tbody tr",
  "list": [{
    "name": "IP",
    "mode": "css",
    "expression": "[data-title=IP]",
    "target": "text"
  }, {
    "name": "PORT",
    "mode": "css",
    "expression": "[data-title=PORT]",
    "target": "text"
  }, {
    "name": "Degree",
    "mode": "css",
    "expression": "[data-title=匿名度]",
    "target": "text"
  }, {
    "name": "type",
    "mode": "css",
    "expression": "[data-title=类型]",
    "target": "text"
  }, {
    "name": "speed",
    "mode": "css",
    "expression": "[data-title=响应速度]",
    "target": "text"
  }]
}]

module.exports = setProxy;

function setProxy(data, next) {
  var url = data.url;
  var request = data.request;
  var reqRule = data.request_options;
  if (!request || !url) {
    return next();
  }
  debug('setProxy');
  getProxy().then(function(proxy) {
    debug('get proxy', proxy);
    request.proxy = proxy.protocol + '://' + proxy.ip + ':' + proxy.port;
    return next();
  }).catch(function(e) {
    debug(e);
    return next();
  })
}


function getProxy() {
  var defer = Q.defer();
  if (proxyList.length) {
    defer.resolve(proxyList[0]);
  } else {
    crawlProxy().then(function(_) {
      debug('hello');
      defer.resolve(proxyList[0]);
    }).catch(function(err) {
      defer.reject(err);
    })
  }
  return defer.promise;
}

function testProxy(host, cb) {
  if (!session) {
    session = ping.createSession();
  }
  session.pingHost(host, cb);
}

function testAll(proxys, callback) {
  async.filter(proxys, function(p, cb) {
    testProxy(p.IP, function(err) {
      return cb(null, !err)
    });
  }, callback);
}

function crawlProxy() {
  var defer = Q.defer();
  request(proxyUrls[0], function(err, resp, body) {
    if (err) {
      defer.reject(err);
    } else {
      var proxys = parser.parse(body.toString(), rules)[0].result;
      if (!proxys || !proxys.length) {
        defer.reject(new Error('No Proxys from WebSite'));
      } else {
        testAll(proxys, function(err, goods) {
          var goods = goods.map(transfer);
          goods.forEach(function(p) {
            proxyList.push(p);
          })
          defer.resolve();
        })
      }
    }
  })
  return defer.promise;
}

function transfer(proxy) {
  // var protocol = proxy.type.split(',')[0].toLowerCase();
  var protocol = 'http';
  var port = parseInt(proxy.PORT);
  var ip = proxy.IP;
  return {
    protocol: protocol,
    port: port,
    ip: ip
  }
}
