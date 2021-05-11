var debug = require('debug')('mydebug:runner');
var Spider = require('../engine/engine2.js');
var _ = require('underscore');
var nats = require('nats');
var consul_helper = require('./lib/consulHelper/consul_helper.js');
var consul = require('consul')({
  promisify: consul_helper.fromCallback
});

/*
[{
  spider:{Scheduler实例},
  project:{project配置},
  state:{spider状态}
}]
*/
var spiderPool = [];
var limit;
var queue_service_name;
var queue_service_address;
var self_address;
var start_queue = 'start_queue';
var stop_queue = 'stop_queue';
var check_queue = 'check_queue';
var update_queue = 'runner_update';
var death_queue = 'runner_death';
var update_request_queue = 'update_request';
//spider完成后通知scheduler
var done_notice = 'spider_done';
var state = 'initial';

//获取服务并监听队列
var start = function(opts) {
  opts = opts || {};
  //TODO:把limit的初始化设置抽离
  limit = opts.limit || 8;
  self_address = opts.address;
  queue_service_name = opts.queue_service_name || 'queue_service';
  var getService = consul_helper.getService.bind(consul);
  return getService(queue_service_name)
    .then(doStart)
    .catch(function(e) {
      console.log(e);
      throw e;
    })
}

var doStart = function(address) {
  queue_service_address = address;
  nats = nats.connect(queue_service_address);
  nats.subscribe(start_queue, {
    'queue': start_queue
  }, startHandle);
  nats.subscribe(stop_queue, stopHandle);
  nats.subscribe(check_queue, checkHandle);
  nats.subscribe(update_request_queue, updateReqHandle);
  state = 'connect';
  updateHandle();
}

var updateReqHandle = function(msg, reply) {
  debug('update request receive');
  var s = getState();
  if (reply) {
    nats.publish(reply, new Buffer(JSON.stringify(s)));
  }
}

//TODO:约定msg内容
var startHandle = function(msg, reply) {
  var task = JSON.parse(msg.toString());
  debug('receive start task:', task);
  create(task, function(e, result) {
    var resp = {};
    if (!e && result) {
      resp.success = true;
    } else {
      resp.success = false;
      resp.message = e.message;
    }
    resp.state = getState();
    if (reply) {
      nats.publish(reply, new Buffer(JSON.stringify(resp)));
    }
  })
}

//TODO:跟startHandle几乎一样,重构？
var stopHandle = function(msg, reply) {
  var task = JSON.parse(msg.toString());
  debug('receive stop task:', task);
  stop(task, function(e, remains) {
    var resp = {};
    if (!e && remains) {
      resp.success = true;
    } else {
      resp.success = false;
      resp.message = e.message;
    }
    resp.state = getState();
    resp.remains = remains;
    if (resp.success && reply) {
      nats.publish(reply, new Buffer(JSON.stringify(resp)));
    }
  })
}

var checkHandle = function(msg, reply) {
  var task = JSON.parse(msg.toString());
  debug('receive stop task:', task);
  check(task, function(e, remains) {
    var resp = {};
    if (!e && remains) {
      resp.success = true;
    } else {
      resp.success = false;
      resp.message = e.message;
    }
    resp.state = getState();
    resp.remains = remains;
    if (resp.success && reply) {
      nats.publish(reply, new Buffer(JSON.stringify(resp)));
    }
  })
}

var updateHandle = function() {
  if (state != 'connect')
    return;
  var s = getState();
  debug('send update', s);
  nats.publish(update_queue, new Buffer(JSON.stringify(s)));
}

function spiderStartHandle(spi) {
  spiderPool.push({
    spider: spi,
    project: spi.project,
    state: 'running'
  })
  updateHandle();
}

function spiderDoneHandle(remains, spi) {
  spi.removeAllListeners();
  spi = null;
  // console.log(remains);
  //spider完成时通知Scheduler或manager
  if (nats.publish) {
    debug('send spider done:');
    // nats.publish(done_notice, new Buffer(JSON.stringify(remains.project)));
    var msg = remains;
    msg.response = remains.q_finished.length;
    msg.err = _.reduce(_.values(remains.bad_urls), function(memo, num) {
      return memo + num;
    }, 0);
    debug('send:' + msg);
    nats.publish(done_notice, new Buffer(JSON.stringify(msg)));
  }
  spiderPool = deleteSpider.call(spiderPool, remains.project);
  updateHandle();
}

var create = function(prj, cb) {
  if (spiderPool.length >= limit) {
    return cb(new Error('No Spiders'))
  }
  try {
    var spider = new Spider();
    spider.on('start', spiderStartHandle);
    spider.on('done', spiderDoneHandle);
    spider.start(prj);
    return cb(null, true);
  } catch (e) {
    console.log(e);
    return cb(e);
  }
}

var stop = function(opts, cb) {
  var ts = _.find(spiderPool, function(spiItem) {
    return spiItem.project.id == opts.id;
  });
  if (!ts) {
    return cb(new Error('No this project'));
  }
  var remains = ts.spider.stop();
  if (remains) {
    return cb(null, remains)
  } else {
    return cb(new Error('no remains'));
  }
}

var check = function(opts, cb) {
  var ts = _.find(spiderPool, function(spiItem) {
    return spiItem.project.id == opts.id;
  });
  if (!ts) {
    return cb(new Error('No this project'));
  }
  var remains = ts.spider.check();
  if (remains) {
    return cb(null, remains)
  } else {
    return cb(new Error('no remains'));
  }
}

var getState = function() {
  return {
    total: limit,
    free: limit - spiderPool.length,
    pid: self_address
  }
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

var reset = function() {
  spiderPool.forEach(function(sp) {
    sp.spider.removeAllListeners();
    sp.spider.stop();
    sp.spider = null;
  })
  spiderPool = [];
}

var deathHandle = function() {
  reset();
  nats.publish(death_queue, self_address);
}

module.exports = {
  start: start,
  create: create,
  stop: stop,
  check: check,
  getState: getState,
  reset: reset,
  deathHandle: deathHandle
}
