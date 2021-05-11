//TODO:1.settings headers 2.get response 3.format
'use strict';
module.exports = download;
var debug = require('debug')('mydebug:phantom');
var phantom = require('phantom');
var path = require('path');
var _ = require('underscore');

function download(opts, cb) {
  debug('phantom download');
  var args = initArgs(opts);
  var execArgs = initExecArgs(opts);
  var _page = null;
  var _ph = null;
  var _out = null;

  phantom.create(args, execArgs)
    .then(ph => {
      debug('create page');
      _ph = ph;
      _out = _ph.createOutObject();
      _out.opts = opts;
      return _ph.createPage();
    })
    .then(page => {
      debug('setRequest');
      _page = page;
      setRequest(_page, opts, _out);
      return;
    })
    .then(_ => {
      debug('open url')
      return _page.open(opts.url);
    })
    .then(status => {
      debug('status:' + status);
      return getResponse(_page, _out)
    })
    .then(resp => {
      _page.close();
      _ph.exit();
      cb(null, resp);
    })
    .catch(e => {
      cb(e)
      _page.close();
      _ph.exit();
    }); //不支持finally
}

function setRequest(phPage, opts, out) {
  try {
    var headers = opts.headers || {};
    phPage.property('customHeaders', headers)
    phPage.property('onResourceReceived', function(resp, outObj) {
      if (resp.url == outObj.opts.url && resp.stage == 'end') {
        outObj.response = resp;
      }
    }, out);
    // phPage.property('onResourceRequested', function() {
    //   console.log('send request')
    // })
    return phPage;
  } catch (e) {
    throw e;
  }
}

function getResponse(phPage, out, cb) {
  var _content;
  var _resp;
  return phPage.property('content')
    .then(content => {
      _content = content;
      return out.property('response');
    })
    .then(response => {
      _resp = response
      _resp.body = _content;
      return formatResponse(_resp);
    })
}

function formatResponse(resp) {
  var _resp = {};
  _resp.statusCode = resp.status;
  var headers = {};
  _.each(resp.headers, h => {
    var key = h.name.toLowerCase();
    if (headers[key]) {
      let kv = headers[key];
      if (_.isArray(kv)) {
        kv.push(h.value);
        headers[key] = kv;
      } else {
        headers[key] = [kv, h.value];
      }
    } else {
      headers[key] = h.value;
    }
  })
  _resp.headers = headers;
  _resp.body = resp.body;
  _resp.type = 'phantom';
  return _resp;
}

function initArgs(opts) {
  var args = [];
  // if (opts.load_images) {
  //   args.push('--load-images=' + opts.load_images ? 'yes' : 'no');
  // }
  args.push('--load-images=no');
  if (opts.ignore_ssl_errors) {
    args.push('--ignore-ssl-errors=' + opts.ignore_ssl_errors ? 'yes' : 'no');
  }
  return args;
}

function initExecArgs(opts) {
  var args = {};
  args.phantomPath = opts.phantomPath ? path.resolve(opts.phantomPath) : __dirname + '/bin/phantomjs';
  if (opts.logger) {
    args.logger = opts.logger;
  }
  if (opts.logLevel) {
    args.logLevel = opts.logLevel;
  }
  return args;
}
