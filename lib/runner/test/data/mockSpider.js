//1.create 2.stop 3.check 4.done 5.get 6.reset
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = MockSpider;

function MockSpider() {
  this.timeList = [];
}

util.inherits(MockSpider, EventEmitter);

var proto = MockSpider.prototype;

proto.start = function(prj) {
  var self = this;
  self.project = prj;
  self.emit('start', self); //?
  var t = setTimeout(function() {
    self.emit('done', self.check(), self);
  }, 2000);
  self.timeList.push(t);
}


proto.stop = function(prj, cb) {
  var self = this;
  self.timeList.forEach(function(t) {
    clearTimeout(t);
  });
  self.timeList = [];
  var remains = self.check();
  self.emit('done', remains, self);
  return remains;
}

proto.check = function() {
  var self = this;
  return {
    project: self.project
  }
}
