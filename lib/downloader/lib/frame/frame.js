var debug = require('debug')('mydebug:frame');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var q = require('q');
var _ = require('underscore');

function frame() {
  this.preStack = [];
  this.postStack = [];
  this.main = null;
}

util.inherits(frame, EventEmitter);

var proto = frame.prototype;

proto.use = function(fn) {
  var self = this;
  if (typeof fn == 'function') {
    self.main = fn;
  }
}

proto.pre = function(fn) {
  var self = this;
  if (typeof fn == 'function') {
    self.preStack.push(fn);
  }
}

proto.post = function(fn) {
  var self = this;
  if (typeof fn == 'function') {
    self.postStack.push(fn);
  }
}

proto.do = function() {
  var self = this;
  if (!self.main) {
    return;
  }
  var argv = arguments;
  self.preStack.forEach(function(fn) {
    fn.apply(null, argv);
  })
  var md = self.main.apply(null, argv);
  self.postStack.forEach(function(fn) {
    fn.call(null, md);
  })
  return md;
}

module.exports = frame;
