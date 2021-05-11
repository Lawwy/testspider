//scheduler:链接调度管理
//主要方法:1.接受新链接 2.输出链接
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require("underscore");
var debug = require('debug')('mydebug:scheduler');
var urlHelper = require('url');
module.exports = Scheduler;

function Scheduler(opts) {
  if (opts) {
    this.inject(opts);
  }
}

util.inherits(Scheduler, EventEmitter);

var sd = Scheduler.prototype;

//注入项目信息
sd.inject = function(opts) {
  opts = opts || {};
  this.project = opts;
  this.maxRequest = opts.maxRequest || 3;
  this.start_url = opts.start_url;
  this.domain = opts.domain;
  this.depth = opts.depth || -1;
  this.q_finished = opts.q_finished || [];
  this.q_running = [];
  this.q_todo = opts.q_todo || [];
  this.bad_urls = {};
  this.urls_depth = opts.urls_depth || {};
  initial.call(this);
}

var initial = function() {
  var self = this;
  if (self.start_url && !self.q_todo.length) {
    self.urls_depth[self.start_url] = 1;
    self.q_todo.push(self.start_url);
  }
  if (self.q_todo.length) {
    self.q_todo.forEach(function(l) {
      self.urls_depth[l] = self.urls_depth[l] || 1;
    })
  }
}


sd.shift = function() {
  var self = this;
  if (!self.q_todo.length && !self.q_running.length) {
    var remains = self.check();
    self.emit('done', remains);
    return;
  }
  var url = self.q_todo.shift();
  if (url) {
    self.q_running.push(url);
  }
  return url;
}

sd.pushNew = function(links, parlink) {
  var self = this;
  links = _.uniq(links);
  links = self.dropDuplicate(links);
  var parentDepth = parlink ? self.urls_depth[parlink] : 0;
  if (parentDepth + 1 <= self.depth || self.depth < 0) {
    _.each(links, function(l) {
      self.urls_depth[l] = parentDepth + 1;
      self.q_todo.push(l);
    })
    self.emit('newlink');
  }
}

sd.pushBad = function(link) {
  var self = this;
  self.bad_urls[link] = _.isUndefined(self.bad_urls[link]) ? 0 : self.bad_urls[link];
  self.bad_urls[link]++;
  if (self.bad_urls[link] < self.maxRequest) {
    self.q_todo.push(link);
    self.emit('newlink');
  }
  deleteUrl.call(self.q_running, link);
}

sd.pushFinished = function(link) {
  var self = this;
  deleteUrl.call(self.q_running, link);
  self.q_finished.push(link);
  self.emit('newFinished');
}

sd.dropDuplicate = function(links) {
  var self = this;
  var targets = _.filter(links, function(l) {
    return !_.contains(self.q_finished, l)
      && !_.contains(self.q_running, l)
      && !_.contains(self.q_todo, l)
  })
  if (self.domain) {
    targets = targets.filter(function(l) {
      return l.indexOf(domain) > -1
    });
  }
  return targets;
}

sd.check = function() {
  var self = this;
  var remains = {};
  remains.q_todo = self.q_todo.slice(0);
  remains.q_finished = self.q_finished.slice(0);
  remains.q_running = self.q_running.slice(0);
  remains.project = _.omit(self.project, 'rule_store');
  remains.bad_urls = self.bad_urls;
  remains.urls_depth = self.urls_depth;
  return remains;
}

sd.isDone = function() {
  var self = this;
  if (!self.q_running.length && !self.q_todo.length) {
    var remains = self.check();
    self.emit('done', remains);
    return true;
  } else {
    return false;
  }
}

sd.reset = function() {
  var self = this;
  self.q_todo = [];
  self.q_running = [];
}

var deleteUrl = function(url) {
  var arr = this;
  var index = _.indexOf(arr, url);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}
