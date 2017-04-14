//TODO:design a base class
var EventEmitter = require('events').EventEmitter;
var Scheduler = require('../scheduler/scheduler3.js');
var util = require('util');
var _ = require("underscore");
var debug = require('debug')('mydebug:engine');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var async = require('async');

module.exports = Engine;
/**
 *
 * @param {Object} queue_service :队列服务实例
 * @param {Mixed} factory :调度器构造方法，下载器构造方法等
 * @param {Mixed} services:解析方法
 */

function Engine(factory, services, queue) {
  this.queue = queue;
  this.factory = factory;
  this.services = services;
  this.state = 'initial';
  this.scheduler = null;
}

util.inherits(Engine, EventEmitter);

var proto = Engine.prototype;

proto.start = function(prj) {
  var self = this;
  self.initial(prj);
  self.state = 'running';
  self.emit('start', self);
  self.doStart();
// self.action(); //中间件形式启功
}

proto.initial = function(prj) {
  var self = this;
  var scheOpts = _.omit(prj, 'rule_store');
  self.project = prj;
  self.scheduler = new self.factory.Scheduler(scheOpts);
  self.downloader = new self.factory.Downloader(prj);
  self.downloader.on('download_success', downloadSuccessHandle.bind(self));
  self.downloader.on('download_fail', downloadFailHandle.bind(self));
  self.scheduler.on('done', doneHandle.bind(self));
}



proto.doStart = function() {
  var self = this;
  var url = self.scheduler.shift();
  var req = {
    url: url
  };
  self.downloader.download(req);
}

proto.stop = function() {
  var self = this;
  self.downloader.removeAllListeners();
  self.scheduler.removeAllListeners();
  var remains = self.scheduler.check();
  self.scheduler.reset();
  self.emit('done', remains, self);
  self.state = 'done';
  return remains;
}

proto.isFree = function() {
  var self = this;
  if (self.state === 'running') {
    return false;
  } else {
    return true;
  }
}

var downloadSuccessHandle = function(resp) {
  var self = this;
  // if (!resp) {
  debug('download success', resp.url);
  setTimeout(function() {
    self.doStart();
  }, Math.random() * 5000);
  // }
  if (resp && resp.redirect) {
    self.scheduler.pushNew(resp.newlink);
    self.scheduler.pushFinished(resp.url);
  }
  if (resp && resp.body) {
    var rules = findUrlRule(resp.url, self.project.rule_store);
    //提取链接
    if (rules && rules.link_parse_rule && rules.link_parse_rule.length) {
      var newlinks = self.services.linkparse(resp.body, rules.link_parse_rule, resp.url);
      var newlinks = gatherlinks(newlinks);
      debug(newlinks);
      self.scheduler.pushNew(newlinks, resp.url);
    }
    //提取内容
    if (rules && rules.content_parse_rule && rules.content_parse_rule.length) {
      var collections = self.services.contentparse(resp.body, rules.content_parse_rule, resp.url);
      debug(collections);
      var savepath = self.project.savePath || path.resolve('./lib/engine/data');
      savepath = savepath + '/' + new Date().getTime() + '.json';
      fs.writeFileSync(savepath, JSON.stringify(collections[0].result));
    }
    self.scheduler.pushFinished(resp.url);
  }
  //用于测试
  self.emit('download_finish');
}

var gatherlinks = function(lrs) {
  var links = [];
  lrs.map(function(l) {
    return l.result;
  }).forEach(function(arr) {
    links = links.concat(arr)
  })
  return links;
}

var downloadFailHandle = function(resp) {
  var self = this;
  debug('download fail', resp.url);
  setTimeout(function() {
    self.doStart();
  }, Math.random() * 5000);
  self.scheduler.pushBad(resp.url);
}

var doneHandle = function(resp) {
  var self = this;
  return self.stop();
}

var findUrlRule = function(url, ruleStore, field) {
  if (!url || !ruleStore) {
    return null;
  }
  var target_rule = null;
  for (var i = 0; i < ruleStore.length; i++) {
    var item = ruleStore[i];
    if (urlMatch(url, item.url_pattern)) {
      target_rule = item;
      break;
    }
  }
  if (field && target_rule) {
    return target_rule[field];
  }
  return target_rule;
}

var urlMatch = function(url, patterns) {
  var flag = false;
  flag = _.some(patterns, function(p) {
    var reg = new RegExp(p);
    return reg.test(url);
  })
  return flag;
}

//试验
proto.action = function() {
  var self = this;
  return preHandle.bind(self)()
    .then(doDownload.bind(self))
    .then(handleDownloadFail.bind(self))
    .then(handleRedirect.bind(self))
    .then(extractLinks.bind(self))
    .then(parseContent.bind(self))
    .then(save.bind(self))
    .catch(errHandle.bind(self))
}

var preHandle = function() {
  var self = this;
  var defer = Q.defer();
  if (self.state == 'done') {
    defer.reject(new Error('stop or done'))
  }
  var url = self.scheduler.shift();
  if (!url) {
    setTimeout(self.action.bind(self), Math.random() * 5000);
    defer.reject(new Error('Url_Empty'));
  }
  defer.resolve({
    url: url
  });
  return defer.promise;
}

var doDownload = function(req) {
  debug('doDownload', req);
  var self = this;
  var defer = Q.defer();
  self.services.download(req, function(e, res) {
    var resp = {};
    resp.url = req.url;
    if (e) {
      resp.success = false;
      resp.error = e;
    } else {
      resp.success = true;
      if (res.statusCode == 301 || res.statusCode == 302) {
        resp.redirect = true;
        resp.newlink = resp.headers['location'];
      } else {
        resp.body = res.body;
      }
    }
    defer.resolve(resp);
  })
  return defer.promise;
}

var handleDownloadFail = function(resp) {
  var self = this;
  var defer = Q.defer();
  if (resp.success) {
    defer.resolve(resp);
  } else {
    debug('download fail', resp.url);
    setTimeout(self.action.bind(self), Math.random() * 5000);
    self.scheduler.pushBad(resp.url);
    defer.resolve(resp);
  }
  return defer.promise;
}

var handleRedirect = function(resp) {
  var self = this;
  var defer = Q.defer();
  if (!resp.redirect) {
    defer.resolve(resp);
  } else {
    debug('handleRedirect', resp.url);
    self.scheduler.pushNew(resp.newlink);
    self.scheduler.pushFinished(resp.url);
    setTimeout(self.action.bind(self), Math.random() * 5000);
    defer.resolve();
  }
  return defer.promise;
}

var extractLinks = function(resp) {
  var self = this;
  var defer = Q.defer();
  if (!resp || !resp.body) {
    defer.resolve(resp);
  } else {
    debug('extractLinks', resp.url);
    var parseRule = findUrlRule(resp.url, self.project.rule_store, 'link_parse_rule');
    if (!parseRule) {
      defer.resolve(resp);
    } else {
      var newlinks = self.services.linkparse(resp.body, parseRule, resp.url);
      var newlinks = gatherlinks(newlinks);
      self.scheduler.pushNew(newlinks, resp.url);
      defer.resolve(resp);
    }
  }
  return defer.promise;
}

var parseContent = function(resp) {
  var self = this;
  var defer = Q.defer();
  if (!resp || !resp.body) {
    defer.resolve(resp);
  } else {
    debug('parseContent', resp.url);
    var parseRule = findUrlRule(resp.url, self.project.rule_store, 'content_parse_rule');
    if (!parseRule) {
      defer.resolve(resp);
    } else {
      var collections = self.services.contentparse(resp.body, parseRule, resp.url);
      defer.resolve(collections);
    }
    self.scheduler.pushFinished(resp.url);
    //用于测试
    self.emit('download_finish');
    setTimeout(self.action.bind(self), Math.random() * 5000);
  }
  return defer.promise;
}

var save = function(collections) {
  var self = this;
  var defer = Q.defer();
  if (collections && collections.length) {
    var savepath = self.project.savePath || path.resolve('./lib/engine/data');
    savepath = savepath + '/' + new Date().getTime() + '.json';
    fs.writeFile(savepath, JSON.stringify(collections), function(e) {
      if (e) {
        defer.reject()
      } else {
        defer.resolve()
      }
    });
  } else {
    defer.resolve();
  }
  return defer.promise;
}

var errHandle = function(e) {
  var self = this;
  debug(e.message);
// console.log(e);
}
