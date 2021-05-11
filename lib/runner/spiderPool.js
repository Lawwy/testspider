//1.create 2.stop 3.check 4.done 5.get 6.reset
var _ = require('underscore');
var Spider = require('../engine/engine2.js');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _instance = null;

module.exports = SpiderPool;
// module.exports = function(limit) {
//   if (_instance) {
//     return _instance
//   } else {
//     return new SpiderPool(limit);
//   }
// }

function SpiderPool(limit) {
  this.limit = limit || 5;
  this.pool = [];
}

util.inherits(SpiderPool, EventEmitter);

var proto = SpiderPool.prototype;

proto.create = function(prj, cb) {
  var self = this;
  if (self.pool.length >= self.limit) {
    return cb(new Error('No Spiders'))
  }
  try {
    var spider = new Spider();
    spider.on('start', spiderStartHandle.bind(self));
    spider.on('done', spiderDoneHandle.bind(self));
    spider.start(prj);
    return cb(null, true);
  } catch (e) {
    console.log(e);
    return cb(e);
  }
}

proto.stop = function(prj, cb) {
  var self = this;
  var ts = _.find(self.pool, function(spiItem) {
    return spiItem.project.id == prj.id;
  });
  if (!ts) {
    return cb(new Error('No this project'));
  }
  var remains = ts.spider.stop();
  return cb(null, remains);
}

proto.check = function(prj, cb) {
  var self = this;
  var ts = _.find(self.pool, function(spiItem) {
    return spiItem.project.id == prj.id;
  });
  if (!ts) {
    return cb(new Error('No this project'));
  }
  var remains = ts.spider.check();
  return cb(null, remains);
}

proto.reset = function() {
  var self = this;
  self.pool.forEach(function(sp) {
    sp.spider.removeAllListeners();
    sp.spider.stop();
    sp.spider = null;
  })
  spiderPool = [];
}

proto.getState = function() {
  var self = this;
  return {
    total: self.limit,
    free: self.limit - self.pool.length
  }
}

function spiderStartHandle(spi) {
  var self = this;
  self.pool.push({
    spider: spi,
    project: spi.project,
    state: 'running'
  })
  self.emit('spider_start');
  self.emit('update', self.getState());
}

function spiderDoneHandle(remains, spi) {
  var self = this;
  spi.removeAllListeners();
  deleteSpider.call(self.pool, remains.project);
  self.emit('spider_done', remains);
  self.emit('update', self.getState());
}

var deleteSpider = function(project) {
  var arr = this;
  var index = _.findIndex(arr, function(item) {
    return item.project.id == project.id
  });
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}
