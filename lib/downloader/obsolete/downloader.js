var debug = require('debug')('mydebug:downloader');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dw = require('./lib/download/index.js');
var linkparse = require('./tools');

module.exports = downloader;

function downloader(options) {
  options = options || {};
  this.projectId = options.id;
  this.projectName = options.name;
  this.successCount = 0;
  this.failCount = 0;
}

util.inherits(downloader, EventEmitter);

var proto = downloader.prototype;

proto.download = function(reqOpts, linkRules) {
  var self = this;
  var downloadFunc = dw(reqOpts.isDynamic);
  debug('receive task');
  debug(reqOpts);
  downloadFunc(reqOpts, function(e, page) {
    var resp = {};
    resp.url = reqOpts.url;
    resp.request = reqOpts;
    if (e) {
      resp.success = false;
    } else {
      resp.success = true;
      resp.body = page;
    }
    if (!e && linkRules) {
      resp.links = linkparse(page, linkRules);
    }
    resp.links = resp.links || [];
    self.emit('download_response', resp, self);
  })
}
