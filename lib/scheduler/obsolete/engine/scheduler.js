//TODO:design a base class
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require("underscore");
var debug = require('debug')('mydebug:scheduler');

module.exports = Scheduler;

/**
 *
 * @param {Object} queue_service :队列服务实例
 * @param {Mixed} factory :下载器构造方法，解析器构造方法等
 */
/*
* TODO:依赖注入？是否还需要engine的角色？
*/
function Scheduler(factory, queue_service) {
  this.queue = queue_service;
  this.factory = factory;
  this.state = 'initial';
  this.q_finished = [];
  this.q_running = [];
  this.q_todo = [];
  this.bad_urls = {};
  this.urls_depth = {};
  this.currentProjId = '';
  this.currentProjName = '';
  this.maxRequest = 3;
}

util.inherits(Scheduler, EventEmitter);

var sd = Scheduler.prototype;

//监听下载器，链接解析器事件
sd.start = function(projOpts, cb) {
  var self = this;
  if (self.state == 'running') {
    return;
  }
  self.projOpts = projOpts || {};
  self.currentProjId = projOpts.id;
  self.currentProjName = projOpts.name;
  self.domain = projOpts.domain;
  self.depth = _.isNumber(projOpts.depth) ? projOpts.depth : -1;
  //TODO:多个下载器的情况
  self.downloader = new self.factory.Downloader();
  self.downloader.on('download_response', downloadRespHandle.bind(self));
  var start_url = self.projOpts.start_url;
  //记录深度
  if (start_url) {
    self.urls_depth[start_url] = 1;
    if (self.urls_depth[start_url] <= self.depth || self.depth < 0) {
      self.q_todo.push(start_url);
    }
    self.emit('start', self);
    self.doStart();
  } else {
    return false;
  }

}

sd.doStart = function() {
  var self = this;
  if (!self.q_todo.length && !self.q_running.length) {
    var remains = self.check();
    self.emit('done', remains, self);
    self.state = 'done';
    return;
  }
  var url = self.q_todo.shift();
  if (url) {
    var parseRule = findUrlRule(url, self.projOpts.rule_store, 'link_parse_rule');
    parseRule = parseRule || [];
    self.downloader.download({
      url: url
    }, parseRule);
    self.q_running.push(url);
    self.state = 'running';
  }
}

//取消监听器
//TODO:sd.reset
sd.stop = function() {
  var self = this;
  self.downloader.removeAllListeners();
  // self.linkparser.removeAllListeners();
  var remains = self.check();
  //reset
  self.q_todo = [];
  self.q_running = [];
  self.q_finished = [];
  self.currentProjId = '';
  self.currentProjName = '';
  self.bad_urls = {};
  self.emit('done', remains, self);
  self.state = 'done';
  return remains;
}

sd.isFree = function() {
  var self = this;
  if (self.state === 'running') {
    return false;
  } else {
    return true;
  }
}

sd.check = function() {
  var self = this;
  var remains = {};
  remains.q_todo = self.q_todo.slice(0);
  remains.q_finished = self.q_finished.slice(0);
  remains.q_running = self.q_running.slice(0);
  remains.project = self.projOpts;
  remains.bad_urls = self.bad_urls;
  return remains;
}

/**
 *
 * @param {Mixed} resp :下载响应
    {
      success {boolean}
      url {string}
      req {object}
      links {Array}
    }
 * @param {Object} dw :下载器
 */
var downloadRespHandle = function(resp, dw) {
  var self = this;
  debug('receive download_response');
  debug(resp.success, resp.url, resp.links);
  if (resp.success) {
    var links = dropDuplicate(resp.links, self.q_finished, self.domain);
    //深度控制
    var parentDepth = self.urls_depth[resp.url];
    if (parentDepth + 1 <= self.depth || self.depth < 0) {
      _.each(links, function(l) {
        self.urls_depth[l] = parentDepth + 1;
        self.q_todo.push(l);
      })
    }
    deleteUrl.call(self.q_running, resp.url);
    self.q_finished.push(resp.url);
  } else {
    self.bad_urls[resp.url] = _.isUndefined(self.bad_urls[resp.url]) ? 0 : self.bad_urls[resp.url];
    self.bad_urls[resp.url]++;
    if (self.bad_urls[resp.url] < self.maxRequest) {
      self.q_todo.push(resp.url);
    }
    deleteUrl.call(self.q_running, resp.url);
  }
  //用于测试
  self.emit('download_finish', resp, self);
  self.doStart();
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

var deleteUrl = function(url) {
  var arr = this;
  var index = _.indexOf(arr, url);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

var dropDuplicate = function(links, finishs, domain) {
  var targets = _.filter(links, function(l) {
    return !_.contains(finishs, l);
  })
  //同域名
  if (domain) {
    targets = _.filter(targets, function(l) {
      return l.indexOf(domain) > 0
    })
  }
  return targets;
}

var urlMatch = function(url, patterns) {
  var flag = false;
  flag = _.some(patterns, function(p) {
    var reg = new RegExp(p);
    return reg.test(url);
  })
  return flag;
}
