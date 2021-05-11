var debug = require('debug')('mydebug:downloader');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dw = require('./lib/download/index.js');

module.exports = downloader;

function downloader(options) {
  options = options || {};
  this.projectId = options.id;
  this.projectName = options.name;
}

util.inherits(downloader, EventEmitter);

var proto = downloader.prototype;

proto.download = function(reqOpts, cb) {
  debug('receive task', reqOpts);
  var self = this;
  if (!reqOpts.url) {
    self.emit('download_success');
    if (typeof cb == 'function') {
      return cb(new Error('no url'));
    } else {
      return;
    }
  }
  var downloadFunc = dw(reqOpts.isDynamic);
  downloadFunc(reqOpts, function(e, body, res) {
    var resp = {};
    resp.url = reqOpts.url;
    if (e) {
      resp.error = e;
      self.emit('download_fail', resp);
    } else {
      if (res.statusCode == 301 || res.statusCode == 302) {
        resp.redirect = true;
        resp.newlink = resp.headers['location'];
        self.emit('download_success', resp);
      } else {
        resp.body = body;
        self.emit('download_success', resp);
      }
    }
    if (typeof cb == 'function') {
      return cb(e, page, res);
    } else {
      return;
    }
  })
}
