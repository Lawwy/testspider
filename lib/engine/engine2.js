//TODO:design a base class
var EventEmitter = require('events').EventEmitter;
var Scheduler = require('../scheduler/scheduler3.js');
//中间件框
var Frame = require('../common/middleframe/frame');
var util = require('util');
var _ = require("underscore");
var debug = require('debug')('mydebug:engine');
var fs = require('fs');
var path = require('path');
var cookie = require('./lib/cookies.js');

var coreMws = require('./coreMws.js');
var download = require('./middleware/downloader');
var linkparse = require('./middleware/linkparser');
var contentparse = require('./middleware/contentparser');
var pipeline = require('./middleware/pipeline');
var defaultSettings = require('./defaultSettings.json');

module.exports = Engine;
/**
 *
 * @param {Object} settings :设置
 * @param {Mixed} services:
 */

function Engine(settings, services) {
  this.state = 'initial';
  this.initial(settings, services);
}

util.inherits(Engine, EventEmitter);

var proto = Engine.prototype;

//settings 初始化scheduler,设置中间件等
proto.initial = function(settings, services) {
  debug('initial');
  var self = this;
  settings = settings || require('./defaultSettings.json');
  self.timeout = settings.timeout || 3000;
  self.cookieJar = new cookie.jar();
  self.scheduler = new Scheduler();
  self.scheduler.on('done', schedulerDoneHandle.bind(self));
  //设置中间件
  self.downloader = assemble(settings.download || defaultSettings.download, download);
  self.downloader.pre(coreMws.getCookies.bind(self));
  self.downloader.post(coreMws.storeCookies.bind(self));
  self.linkparser = assemble(settings.linkparse || defaultSettings.linkparse, linkparse);
  self.linkparser.post(coreMws.pushLinks.bind(self));
  self.contentparser = assemble(settings.contentparse || defaultSettings.contentparse, contentparse);
  self.contentparser.post(coreMws.parseFinishedHandle.bind(self));
  self.pipeline = assemble(settings.pipeline || defaultSettings.pipeline, pipeline);
}

proto.start = function(prj) {
  var self = this;
  self.project = prj;
  self.scheduler.inject(prj);
  self.state = 'running';
  self.emit('start', self);
  self.doStart(); //中间件形式启功
}

//粗略并发
proto.doStart = function(num) {
  num = num || 1;
  for (var i = 0; i < num; i++) {
    this.action();
  }
};

proto.action = function() {
  var self = this;
  if (!self.main) {
    self.main = new Frame();
    self.main.pre(coreMws.getRequest.bind(self));
    self.main.pre(coreMws.findUrlRule.bind(self));
    self.main.pre(self.downloader.do.bind(self.downloader));
    self.main.pre(self.linkparser.do.bind(self.linkparser));
    self.main.pre(self.contentparser.do.bind(self.contentparser));
    self.main.post(self.pipeline.do.bind(self.pipeline));
  }
  var opts = {};
  opts.start = new Date().getTime();
  self.main.do(opts, finalHandle.bind(self));
}

proto.check = function() {
  var self = this;
  var remains = self.scheduler.check();
  remains.state = self.state;
  return remains;
};

proto.stop = function() {
  var self = this;
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

var schedulerDoneHandle = function(resp) {
  debug('schedulerDoneHandle');
  var self = this;
  return self.stop();
}

var assemble = function(settings, fns) {
  settings = settings;
  var frame = new Frame(fns.main);
  assemblePart.call(frame, 'pre', settings.pre, fns);
  assemblePart.call(frame, 'post', settings.post, fns);
  assemblePart.call(frame, 'err', settings.err, fns);
  return frame;
}

var assemblePart = function(type, settings, fns) {
  var frame = this;
  if (settings && settings.length) {
    settings.forEach(function(fnName) {
      let mf = fnName.split('.');
      let m = mf[0];
      let fn = mf[1];
      if (fn) {
        frame[type](fns[m][fn]);
      } else {
        frame[type](fns[m]);
      }
    })
  }
}

var finalHandle = function(err, data) {
  debug('END OF REQUSEST', data.url);
  var self = this;
  data.end = new Date().getTime();
  if (err) {
    debug(err.type);
    if (err.type == 'project_done') {
      return;
    }
    // if (err.type == 'empty_url') {
    // }
    if (err.type == 'download_fail') {
      debug('downloadFail:download_fail');
      self.scheduler.pushBad(data.url);
    }
    if (err.type == 'redirect') {
      debug('downloadFail:redirect')
      var resp = data.response;
      self.scheduler.pushNew(resp.redirect, resp.url);
      self.scheduler.pushFinished(resp.url);
    }
  }
  var duration = data.end - data.start;
  if (duration > self.timeout) {
    debug('Next Request');
    setImmediate(self.action.bind(self));
  } else {
    var gap = self.timeout - duration;
    debug('Next Request After ', gap);
    setTimeout(self.action.bind(self), gap);
  }
}
