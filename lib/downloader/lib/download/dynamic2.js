module.exports = download;
var debug = require('debug')('mydebug:dynamic');
var phantom = require('phantom');
var path = require('path');

function download(opts,cb) {
  debug('enter the function');
  var args = initArgs(opts);
  var execArgs = initExecArgs(opts);
  var sitepage = null;
  var phInstance = null;
  phantom.create(args,execArgs)
    .then(function(instance) {
      phInstance = instance;
      return phInstance.createPage();
    })
    .then(function(page) {
      debug('page created');
      sitepage = page;
      return sitepage.setting("userAgent",'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36');
    })
    .then(function(_) {
      return sitepage.open(opts.url);
    })
    .then(function(status) {
      if(status == 'success'){
        sitepage.property('content').then(function(content) {
          phInstance.exit();
          return cb(null,content);
        })
      }
      phInstance.exit();
      return cb(new Error('fail'));
    })
    .catch(function(e) {
      phInstance.exit();
      return cb(e);
    })
}

function initArgs(opts) {
  var args = [];
  if(opts.load_images){
    args.push('--load-images='+opts.load_images?'yes':'no');
  }
  if(opts.ignore_ssl_errors){
    args.push('--ignore-ssl-errors='+opts.ignore_ssl_errors?'yes':'no');
  }
  return args;
}

function initExecArgs(opts) {
  var args={};
  args.phantomPath = opts.phantomPath?path.resolve(opts.phantomPath):__dirname+'/bin/phantomjs';
  if(opts.logger){
    args.logger = opts.logger;
  }
  if(opts.logLevel){
    args.logLevel = opts.logLevel;
  }
  return args;
}
