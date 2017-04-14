var debug = require('debug')('mydebug:coreMiddlewares');
var _ = require('underscore');

module.exports = {
  getDefaultLinkRules: getDefaultLinkRules,
  getRequest: getRequest,
  handleRedirect: handleRedirect,
  pushLinks: pushLinks,
  parseFinishedHandle: parseFinishedHandle,
  findUrlRule: findUrlRule,
  getCookies: getCookies,
  storeCookies: storeCookies
}

// function doneHandle(err, data, next) {
//   debug('doneHandle');
//   var self = this;
//   if (err.type == 'project_done') {
//     // self.stop();
//   }
//   return next(err);
// }

function getDefaultLinkRules(data, next) {
  if (data.linkRules && data.linkRules.length) {
    return next();
  }
  data.linkRules = [{
    name: 'a',
    mode: 'css',
    type: 'link',
    expression: 'a',
    target: '@href'
  }];
  return next();
}

function getRequest(data, next) {
  debug('getRequest', data);
  var self = this;
  if (self.state == 'done') {
    var e = new Error('project_done');
    e.type = 'project_done';
    return next(e);
  }
  var url = self.scheduler.shift();
  if (!url) {
    var e = new Error('empty_url');
    e.type = 'empty_url';
    return next(e);
  }
  data = data || {};
  data.id = self.project.id;
  data.name = self.project.name;
  data.url = url;
  data.request = {
    url: url
  }
  debug('getRequest', data);
  return next();
}

// function downloadFail(err, data, next) {
//   debug('downloadFail');
//   var self = this;
//   if (err.type == 'download_fail') {
//     debug('downloadFail:download_fail');
//     self.scheduler.pushBad(data.url);
//     setTimeout(self.action.bind(self), Math.random() * 5000);
//   }
//   if (err.type == 'redirect') {
//     debug('downloadFail:redirect')
//     var resp = data.response;
//     self.scheduler.pushNew(resp.redirect, resp.url);
//     self.scheduler.pushFinished(resp.url);
//     setTimeout(self.action.bind(self), Math.random() * 5000);
//   }
//   return next(err);
// }

// function emptyUrlHandle(err, data, next) {
//   var self = this;
//   if (err.type == 'empty_url') {
//     setTimeout(self.action.bind(self), Math.random() * 5000);
//   }
//   return next(err);
// }

// function downloadSuccess(data, next) {
//   var self = this;
//   var resp = data.response;
//   debug('downloadSuccess');
//   if (!resp) {
//     var e = new Error('download_fail');
//     e.type = 'download_fail';
//     return next(e);
//   }
//   setTimeout(self.action.bind(self), Math.random() * 5000);
//   return next();
// }

function handleRedirect(data, next) {
  var resp = data.response;
  debug('handleRedirect');
  if (!resp) {
    return next();
  }
  if (resp.statusCode == 301 || resp.statusCode == 302) {
    resp.redirect = resp.headers['location'];
    var e = new Error('redirect');
    e.type = 'redirect';
    return next(e);
  }
  return next();
}

function pushLinks(data, next) {
  debug('pushLinks');
  var self = this;
  var links = data.links;
  var url = data.url;
  if (!links || !links.length) {
    return next();
  }
  self.scheduler.pushNew(links, url);
  return next();
}

function parseFinishedHandle(data, next) {
  var self = this;
  debug('parseFinishedHandle');
  self.scheduler.pushFinished(data.url);
  //用于测试
  self.emit('download_finish');
  return next();
}

function findUrlRule(data, next) {
  debug('findUrlRule');
  var self = this;
  var url = data.url;
  if (!url) {
    return next();
  }
  var ruleStore = self.project.rule_store;
  if (!ruleStore || !ruleStore.length) {
    return next();
  }
  var target_rule = null;
  for (var i = 0; i < ruleStore.length; i++) {
    var item = ruleStore[i];
    if (urlMatch(url, item.url_pattern)) {
      target_rule = item;
      break;
    }
  }
  if (!target_rule) {
    debug('None Url Rule');
    return next();
  }
  var linkRules = target_rule.link_parse_rule;
  var contentRules = target_rule.content_parse_rule;
  var reqRule = target_rule.request_options;
  if (linkRules && linkRules.length) {
    data.link_parse_rule = linkRules;
  }
  if (contentRules && contentRules.length) {
    data.content_parse_rule = contentRules
  }
  if (reqRule) {
    data.request_options = reqRule;
  }
  // debug('link_parse_rule', data.link_parse_rule);
  // debug('content_parse_rule', data.content_parse_rule);
  return next();
}

var urlMatch = function(url, patterns) {
  var flag = false;
  flag = _.some(patterns, function(p) {
    var reg = new RegExp(p);
    return reg.test(url);
  })
  return flag;
}

function getCookies(data, next) {
  var self = this;
  var url = data.url;
  var req = data.request;
  if (!url && !request) {
    return next();
  }
  var cookieString = self.cookieJar.getCookieString(data.url);
  if (cookieString) {
    req.headers = req.headers || {};
    req.headers["cookie"] = cookieString;
  }
  return next();
}

function storeCookies(data, next) {
  var self = this;
  var url = data.url;
  var response = data.response;
  if (!url || !response ||
    !response.headers
    || !response.headers['set-cookie']
    || !response.headers['set-cookie'].length) {
    return next();
  }
  var cookies = response.headers['set-cookie'];
  if (_.isArray(cookies)) {
    cookies.forEach(function(c) {
      self.cookieJar.setCookie(c, url);
    })
  } else {
    self.cookieJar.setCookie(cookies, url);
  }
  return next();
}
