//TODO:design a base class
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require("underscore");
var nats = require('nats');

module.exports = scheduler;

function scheduler(options, queue) {
  EventEmitter.call(this);
  this.options = options || {};
  this.projectId = options.ID;
  this.queue_service = queue;
  this.download_task_queue = "download_task_queue";
  this.linkparse_task_queue = "linkparse_task_queue";
  this.queue = nats;
  this.q_finished = [];
  this.q_running = [];
  this.q_todo = [];
  this.q_stop = [];
  this.engine = null;
  this.state = 'initial';
// console.log(this);
}

util.inherits(scheduler, EventEmitter);

var sd = scheduler.prototype;

sd.start = function(cb) {
  var self = this;
  var start_urls = self.options.start_urls;
  if (!start_urls.length) {
    return cb(new Error('no start_urls'))
  }
  _.each(start_urls, function(url) {
    self.q_todo.push(url);
  });
  // self.queue_service = self.queue_service || "nats://192.168.67.242:4222";
  self.queue = self.queue.connect(self.queue_service);
  // console.log(self.queue)
  self.doStart();
}

sd.doStart = function(gap) {
  var self = this;
  gap = gap || 2000;
  clearInterval(self.engine);
  self.engine = null;
  self.engine = setInterval(function() {
    console.log('todo push');
    if (!self.q_todo.length && !self.q_running.length) {
      self.emit('all_done');
      allDoneHandle.call(self);
      clearInterval(self.engine);
      self.engine = null;
      return;
    }
    // while (url = self.q_todo.shift()) {
    var url = self.q_todo.shift()
    if (!url)
      return;
    var t = self.createTask(url, 'download');
    self.q_running.push(url);
    self.queue.request(self.download_task_queue, JSON.stringify(t), {
      'max': 1
    }, function downloadRespHandle(res) {
      var r = JSON.parse(res.toString());
      console.log('**********download response');
      console.log(r);
      if (r.success) {
        console.log('*********download_success');
        self.emit('download_success', r.data);
        downloadSuccessHandle.call(self, r.data);
      } else {
        downloadFailHandle.call(self, r.data);
        self.emit('download_fail', r.data);
      }
    })
  // }
  }, gap);
  if (self.engine) {
    self.state = 'running';
  }
}

//TODO:分拆成不同任务的生成方法
sd.createTask = function(opts, type) {
  console.log('******** create ' + type + ' task*****');
  console.log(opts);
  var task = {}
  if (_.isString(opts)) {
    task.url = opts;
  }
  if (_.isObject(opts)) {
    task = opts;
  }
  var rule = this.findUrlRule(task.url);
  task.projectId = this.projectId;
  task.responseQueueName = type + this.projectId;
  switch (type) {
    case "download":
      task.url = task.url;
      task.saveAddress = rule.saveAddress || '/Users/lawwy/Lab/html/'
      task.requestOptions = rule.request_options || null;
      break;
    case "linkparse":
      task.link_parse_rule = rule.link_parse_rule || [];
      task.url = task.url;
      task.path = task.path;
      break;
    default:
  }
  return task;
}

sd.findUrlRule = function(opt, field) {
  var ruleStore = this.options.rule_store;
  var target_rule = null;
  for (var i = 0; i < ruleStore.length; i++) {
    var item = ruleStore[i];
    if (urlMatch(opt, item.url_pattern)) {
      target_rule = item;
      break;
    }
  }
  if (field && !target_rule) {
    return target_rule[field];
  }
  return target_rule;
}

var urlMatch = function(url, patterns) {
  var flag = false;
  flag = _.some(patterns, function(p) {
    console.log(p);
    var reg = new RegExp(p);
    return reg.test(url);
  })
  console.log({
    pattern: patterns,
    url: url,
    result: flag
  })
  return flag;
}

sd.stop = function() {
  clearInterval(this.engine);
  this.engine = null;
  var url;
  while (url = this.q_todo.shift()) {
    this.q_stop.push(url);
  }
  this.state = 'stop';
  this.emit('stop_done');
}

sd.restart = function() {
  var url;
  if (this.engine) {
    return;
  }
  while (url = this.q_stop.shift()) {
    this.q_todo.push(url);
  }
  this.doStart();
}

var downloadSuccessHandle = function(t) {
  var self = this;
  self.q_finished.push(t.task.url);
  deleteUrl.call(self.q_running, t.task.url);
  if (!t.path)
    return;
  var task = self.createTask({
    url: t.task.url,
    path: t.path
  }, 'linkparse');
  self.queue.request(self.linkparse_task_queue, JSON.stringify(task), {
    max: 1
  }, function linkRespHandle(res) {
    var r = JSON.parse(res);
    if (!r.success) {
      linkparseFailHandle.call(self, r.data);
      self.emit('linkparse_fail', r.data);
    } else {
      linkparseSuccessHandle.call(self, r.data);
      self.emit('linkparse_success', r.data);
    }
  })
}

var deleteUrl = function(url) {
  var arr = this;
  var index = _.indexOf(arr, url);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

//  sd.on('download_success', function(t, instance) {
//   console.log('download_success');
//   var self = instance;
//   self.q_finished.push(t.task.url);
//   var task = self.createTask({
//     Url: t.task.url,
//     Path: t.Path
//   }, 'linkparse');
//   self.queue.request(self.linkparse_task_queue, JSON.stringify(task), {
//     max: 1
//   }, function linkRespHandle(res) {
//     var r = JSON.parse(res);
//     if (!r.success) {
//       self.emit('linkparse_fail', r.data, self);
//     } else {
//       self.emit('linkparse_success', r.data, self);
//     }
//   })
// })

var linkparseSuccessHandle = function(t) {
  var self = this;
  var links = t.links;
  links = dropDuplicate(links, self.q_finished);
  _.each(links, function(l) {
    self.q_todo.push(l);
  });
}

var dropDuplicate = function(links, finishs) {
  var targets = _.filter(links, function(l) {
    return !_.contains(finishs, l);
  })
  return targets;
}

// sd.on('linkparse_success', function(t, instance) {
//   var self = instance;
//   var links = t.links;
//   _.each(links, function(l) {
//     self.q_todo.push(l);
//   });
// })

var downloadFailHandle = function(t) {
  var self = this;
  deleteUrl.call(self.q_running, t.task.url);
  self.q_todo.push(t.task.url);
}

// sd.on('download_fail', function(t, instance) {
//   var self = instance;
//   self.q_todo.push(t.task.Url);
// })

var linkparseFailHandle = function(t) {
  var self = this;
  downloadSuccessHandle.call(self, t)
}

var allDoneHandle = function() {
  var self = this;
  self.state = 'allDone';
}

// sd.on('linkparse_fail', function(t, instance) {
//   var self = instance;
//   self.emit('download_success', t, self);
// })

sd.check = function() {
  return {
    state: this.state,
    todo: this.q_todo,
    running: this.q_running,
    finished: this.q_finished,
    stop: this.q_stop
  }
}
